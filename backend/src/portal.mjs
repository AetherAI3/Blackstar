import { assertProjectAccess, assertResourceProject } from './access.mjs';
import { exactKeys, requireThat } from './errors.mjs';

const permittedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
export function planAssetUpload({ context, project, input, assetId }) {
  assertProjectAccess(context, project);
  exactKeys(input, ['filename', 'contentType', 'sizeBytes']);
  requireThat(typeof input.filename === 'string' && input.filename.length > 0 && input.filename.length <= 180, 'INVALID_FILENAME');
  requireThat(permittedTypes.includes(input.contentType), 'UNSUPPORTED_ASSET');
  requireThat(Number.isSafeInteger(input.sizeBytes) && input.sizeBytes > 0 && input.sizeBytes <= 100 * 1024 * 1024, 'ASSET_TOO_LARGE');
  requireThat(typeof assetId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(assetId), 'INVALID_ASSET_ID');
  // A user filename is display metadata only; it never becomes a storage path.
  return { id: assetId, organizationId: project.organizationId, projectId: project.id,
    objectKey: `${project.organizationId}/${project.id}/${assetId}`, filename: input.filename,
    declaredContentType: input.contentType, sizeBytes: input.sizeBytes, status: 'quarantine' };
}
export function planAssetDownload({ context, project, asset }) {
  assertProjectAccess(context, project);
  assertResourceProject(asset, project);
  requireThat(asset.status === 'clean', 'ASSET_NOT_READY');
  return { objectKey: asset.objectKey, expiresInSeconds: 300, disposition: 'attachment' };
}
export function submitFeedback({ context, project, deliverable, input, feedbackId }) {
  assertProjectAccess(context, project, ['client_approver']);
  assertResourceProject(deliverable, project);
  exactKeys(input, ['expectedVersion', 'comments']);
  requireThat(project.approverUserId === context.userId, 'NOT_FOUND');
  requireThat(deliverable.version === input.expectedVersion && deliverable.status === 'in_review', 'STALE_VERSION');
  requireThat(Number.isInteger(deliverable.roundsUsed) && deliverable.roundsUsed < deliverable.revisionLimit, 'CHANGE_REQUEST_REQUIRED');
  requireThat(typeof input.comments === 'string' && input.comments.trim().length > 0 && input.comments.length <= 6000, 'INVALID_FEEDBACK');
  return { id: feedbackId, organizationId: project.organizationId, projectId: project.id, deliverableId: deliverable.id,
    version: deliverable.version, round: deliverable.roundsUsed + 1, authorId: context.userId, comments: input.comments.trim() };
}
