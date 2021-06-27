import watchExpression from './watchExpression';
import waitConfirm from './processExpression';

import './styles/index.less';
import waitProcess from './grahp';


function start() {
  watchExpression();
  waitConfirm();
  waitProcess();
}

window.addEventListener('load', () => {
  start();
});
