import watchExpression from './watchExpression';
import waitConfirm from './processExpression';
import waitProcess from './grahp';
import handleError from './handleError';

import './styles/index.less';

function start() {
  watchExpression();
  waitConfirm();
  waitProcess();
  handleError();
}

window.addEventListener('load', () => {
  start();
});
