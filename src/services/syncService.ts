import { Types } from 'mongoose';
import { SyncOperation, AuditLog } from '../models/index.js';
import { InvoiceReportService } from './invoiceReportService.js';
import { PaymentService } from './paymentService.js';
import { DisputeService } from './disputeService.js';
import { logger } from '../utils/logger.js';

export interface BatchSyncItem {
  clientUuid: string;
  operationType: 'CREATE_REPORT' | 'RECORD_PAYMENT' | 'UPDATE_DISPUTE';
  payload: any;
  revision?: number;
  localCreatedAt: string;
}

export class SyncService {
  static async processBatch(
    organizationId: string,
    userId: string,
    clientId: string,
    items: BatchSyncItem[],
    ipAddress?: string,
    userAgent?: string
  ) {
    const results = [];

    for (const item of items) {
      const serverReceivedAt = new Date();

      // Check for already processed sync operation
      const existingOp = await SyncOperation.findOne({
        clientUuid: item.clientUuid,
        organizationId: new Types.ObjectId(organizationId),
      });

      if (existingOp && existingOp.status === 'PROCESSED') {
        results.push({
          clientUuid: item.clientUuid,
          status: 'ACCEPTED',
          serverReceivedAt: existingOp.serverReceivedAt,
          serverCommittedAt: existingOp.serverCommittedAt,
          isReplayed: true,
        });
        continue;
      }

      try {
        let executionResult: any;

        if (item.operationType === 'CREATE_REPORT') {
          executionResult = await InvoiceReportService.createReport(
            organizationId,
            userId,
            item.payload,
            ipAddress,
            userAgent
          );
        } else if (item.operationType === 'RECORD_PAYMENT') {
          executionResult = await PaymentService.recordPayment(
            organizationId,
            userId,
            item.payload,
            ipAddress,
            userAgent
          );
        } else if (item.operationType === 'UPDATE_DISPUTE') {
          executionResult = await DisputeService.submitResponse(
            item.payload.disputeId,
            organizationId,
            userId,
            item.payload,
            ipAddress,
            userAgent
          );
        } else {
          throw new Error(`Unsupported sync operation type: ${item.operationType}`);
        }

        const serverCommittedAt = new Date();

        await SyncOperation.findOneAndUpdate(
          { clientUuid: item.clientUuid },
          {
            clientUuid: item.clientUuid,
            clientId,
            organizationId: new Types.ObjectId(organizationId),
            userId: new Types.ObjectId(userId),
            operationType: item.operationType,
            payload: item.payload,
            status: 'PROCESSED',
            revision: item.revision || 1,
            serverReceivedAt,
            serverCommittedAt,
          },
          { upsert: true, new: true }
        );

        results.push({
          clientUuid: item.clientUuid,
          status: 'ACCEPTED',
          result: executionResult,
          serverReceivedAt,
          serverCommittedAt,
          isReplayed: false,
        });
      } catch (err: any) {
        logger.error({ clientUuid: item.clientUuid, err }, 'Sync Item Failed');

        const isConflict = err.code === 'CONFLICT_REVISION_MISMATCH' || err.statusCode === 409;
        const status = isConflict ? 'CONFLICT' : 'REJECTED';

        await SyncOperation.findOneAndUpdate(
          { clientUuid: item.clientUuid },
          {
            clientUuid: item.clientUuid,
            clientId,
            organizationId: new Types.ObjectId(organizationId),
            userId: new Types.ObjectId(userId),
            operationType: item.operationType,
            payload: item.payload,
            status,
            revision: item.revision || 1,
            serverReceivedAt,
            errorMessage: err.message,
          },
          { upsert: true, new: true }
        );

        results.push({
          clientUuid: item.clientUuid,
          status: isConflict ? 'CONFLICT' : 'REJECTED',
          error: {
            code: err.code || 'SYNC_ERROR',
            message: err.message,
            details: err.details,
          },
          serverReceivedAt,
        });
      }
    }

    return {
      clientId,
      processedCount: results.length,
      successCount: results.filter((r) => r.status === 'ACCEPTED').length,
      conflictCount: results.filter((r) => r.status === 'CONFLICT').length,
      rejectedCount: results.filter((r) => r.status === 'REJECTED').length,
      items: results,
    };
  }
}
