export function resolveDeepLinkedConversation(
  queryValue: string | string[] | undefined,
  conversations: { conversation_id: string }[],
): string | null {
  const value = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  if (!value || conversations.length === 0) return null;
  return conversations.some((c) => c.conversation_id === value) ? value : null;
}
