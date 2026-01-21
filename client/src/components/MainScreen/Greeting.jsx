import { getGreeting } from '../../utils/time';
import styles from './MainScreen.module.css';

export const Greeting = ({ name }) => {
  const greeting = getGreeting();

  return (
    <div className={styles.greetingContainer}>
      <h1 className={styles.greeting}>
        {greeting}, <span className={styles.name}>{name}</span>
      </h1>
    </div>
  );
};
