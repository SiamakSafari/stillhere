import Lottie from 'lottie-react';
import particlesAnimation from '../../assets/animations/particles.json';
import styles from './ParticleBackground.module.css';

export const ParticleBackground = () => {
  return (
    <div className={styles.particleContainer} aria-hidden="true">
      <Lottie
        animationData={particlesAnimation}
        loop={true}
        autoplay={true}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.6
        }}
      />
    </div>
  );
};
