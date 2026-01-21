import styles from './ParticleBackground.module.css';

export const ParticleBackground = () => {
  // Create 15 particles for subtle floating effect
  const particles = Array.from({ length: 15 }, (_, i) => (
    <div key={i} className={styles.particle} />
  ));

  return (
    <div className={styles.particleContainer} aria-hidden="true">
      {particles}
    </div>
  );
};
