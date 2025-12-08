export const getValidImageUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  
  // Replace backslashes with forward slashes for Windows paths
  const normalizedPath = path.replace(/\\/g, '/');
  
  // Ensure it starts with / to be absolute relative to domain root
  if (normalizedPath.startsWith('/')) {
    return normalizedPath;
  }
  return `/${normalizedPath}`;
};

export const getDefaultAvatar = (sex?: string) => {
  const isFemale = sex?.toLowerCase() === 'female' || sex?.toLowerCase() === 'f';
  return getValidImageUrl(isFemale ? 'default-avatar-female.png' : 'default-avatar-male.png');
};
