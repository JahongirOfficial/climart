import AuditLog from '../models/AuditLog';

interface AuditLogParams {
  userId?: string;
  userName?: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string;
  entityName: string;
  changes?: Record<string, { old?: any; new?: any }>;
  ipAddress?: string | string[];
}

/**
 * Log an audit trail entry
 * Call this after successful CRUD operations
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      user: params.userId,
      userName: params.userName || 'Tizim',
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      entityName: params.entityName,
      changes: params.changes,
      ipAddress: Array.isArray(params.ipAddress) ? params.ipAddress[0] : params.ipAddress,
    });
  } catch (error) {
    // Don't throw - audit logging should not break main operations
    console.error('Audit log error:', error);
  }
}
