import styles from './Avatar.module.css';

export const Avatar = ({ name, onClick, size = 'default' }) => {
  // Get initials from name (first letter of first and last name)
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClass = size === 'large' ? styles.avatarLarge : '';

  return (
    <button
      className={`${styles.avatar} ${sizeClass}`}
      onClick={onClick}
      aria-label="Profile"
    >
      {getInitials(name)}
    </button>
  );
};
