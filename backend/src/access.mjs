import { requireThat } from './errors.mjs';

// Context MUST come from a verified identity and current DB memberships, never JSON input.
// Even staff require explicit organization and project access; break-glass is not modeled.
export function assertProjectAccess(context, project, roles = ['staff_admin', 'project_lead', 'client_approver', 'client_contributor']) {
  requireThat(context?.userId && project?.id && project?.organizationId, 'NOT_FOUND');
  const membership = context.memberships?.find(m => m.organizationId === project.organizationId && m.status === 'active');
  requireThat(membership && roles.includes(membership.role) && context.projectIds?.includes(project.id), 'NOT_FOUND');
  return membership;
}
export function assertResourceProject(resource, project) {
  requireThat(resource?.projectId === project.id && resource?.organizationId === project.organizationId, 'NOT_FOUND');
}
