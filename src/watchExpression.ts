/**
 * 监听表达式变化以及监听confirm
 */
import { addEventListener } from './addEventListener';
import emit from './emit';
import { Operator, OperatorKey } from './config';

const removes: (() => void)[] = [];

// function watchInput(input: HTMLInputElement) {
//   removes.push(addEventListener(
//     input,
//     'input',
//     (e) => {
//       e.preventDefault();
//       const { data } = e as InputEvent;
//       input.value = input.value.replace(data || '', '');
      
//       // if (data === null) return;
//       // if (data === '=') {
//       //   const old = input.value;
//       //   input.value = old.replace(/\s/ig, '').replace('=', ' = ');
//       // }
//     },
//   ));
// }

function watchConfirm(confirm: HTMLButtonElement, input: HTMLInputElement) {
  let oldValue = '';
  removes.push(addEventListener(
    confirm,
    'click',
    () => {
      const exp = input.value;
      if (exp === oldValue) return;

      oldValue = exp;
      emit.emit('confirm:exp', exp.toLowerCase());
    }
  ));
}

const Numbers = Array.from({ length: 10 }, (_, index) => String(index));
function watchOperators(list: HTMLUListElement, input: HTMLInputElement) {
  const items = [
    ...Object.keys(Operator).map(key => Operator[key as OperatorKey]),
    ...Numbers,
  ].reduce((html, op) => {
    return html + `
      <li class="item" value="${op}">${op}</li>
    `
  }, '');
  list.innerHTML = items;

  removes.push(addEventListener(
    list,
    'click',
    e => {
      e.stopPropagation();
      const { target } = e as MouseEvent;
      if (target === null) return;
      if ((target as HTMLElement).tagName.toLowerCase() !== 'li') return;

      const content = (target as HTMLLIElement).textContent;
      input.value += content;
    },
  ));
}

export default function watchExpression() {
  const expInput = document.getElementById('expression')! as HTMLInputElement;
  const confirm = document.getElementById('confirm')! as HTMLButtonElement;
  const listWrap = document.getElementById('operator-wrapper')! as HTMLUListElement;

  // watchInput(expInput);
  watchConfirm(confirm, expInput);
  watchOperators(listWrap, expInput);
}
