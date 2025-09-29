import './style.css';
import { App } from './core/app';

const experience = document.getElementById('experience');
if (!experience) {
  throw new Error('Experience container missing');
}

const app = new App(experience);
app.start();

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    app.dispose();
  });
}
