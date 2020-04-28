import * as firebase from 'firebase/app';
import 'firebase/database';
import { MDCRipple } from '@material/ripple/index';
import { MDCTextField } from '@material/textfield';
import { MDCSelect } from '@material/select';
import { Chart } from 'chart.js';
import { MDCTopAppBar } from '@material/top-app-bar';

import {MDCList} from "@material/list";

const testo = document.getElementById('page-0') as HTMLElement;

const grafico = document.getElementById('page-1') as HTMLElement;
grafico.hidden = true;
const list = MDCList.attachTo(document.querySelector('.mdc-list')!);
list.wrapFocus = true;

let menuItemSelected = 0;
list.listen('click', () => {

  const selectedNow = list.selectedIndex as number;
  if (menuItemSelected == selectedNow) {
    return;
  }

  if (selectedNow == 0) {
    testo.hidden = false;
    grafico.hidden = true;
  } else {
    testo.hidden = true;
    grafico.hidden = false;
  }

  menuItemSelected = selectedNow;
})

const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement!);


const getColor = () => Math.round(Math.random() * 255);

const createMenuEntry = (giorno: string) => `<li class="mdc-list-item" data-value="${giorno}"> ${giorno} </li>`.trimLeft();

let curriedPopulate: Function;
const populateChartCurried = (values: firebase.database.DataSnapshot) => (giorno: string) => populateChart(values.child(giorno));

const ctx = (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
let chart: Chart;

// const multiply = (x: number) => (y: number) => x * y;
// console.log(multiply(2)(3));
// const multiplyBy2 = multiply(2);

// console.log(multiplyBy2(10), multiplyBy2(20))

const buttonRipple = new MDCRipple(document.querySelector('.mdc-button') as HTMLElement);
const username = new MDCTextField(document.querySelector('.username') as HTMLElement);
const select = new MDCSelect(document.querySelector('.mdc-select') as HTMLElement);

const dropDownDiv = document.getElementById('dropdown-menu') as HTMLElement;

let oldSelectValue: string;

select.listen('MDCSelect:change', () => {
  console.log(`Selected option at index ${select.selectedIndex} with value "${select.value}"`);
  if (!select.value) return;

  if (select.value === oldSelectValue) return;

  if (chart) chart.destroy();

  oldSelectValue = select.value;
  curriedPopulate(select.value);
});

function populateDropdown(values: firebase.database.DataSnapshot) {
  let giorni: string[] = [];

  values.forEach(elem => {
    giorni.push(elem.key as string);
  });

  select.disabled = false;

  dropDownDiv.innerHTML = `
    <li class="mdc-list-item mdc-list-item--selected" data-value="" aria-selected="true"></li>
    ${giorni.map(createMenuEntry).join('')}
  `;

  curriedPopulate = populateChartCurried(values);
}

function populateChart(giorno: firebase.database.DataSnapshot) {
  let serieKeys: string[] = [];
  let data: number[][] = [];

  giorno.forEach(serie => {
    let serieData: number[] = [];

    serieKeys.push(serie.key as string);

    serie.forEach(elem => {
      serieData.push(elem.val().valore);
    });

    data.push(serieData);
  });

  const maxArrLength = Math.max(...data.map(elem => elem.length));
  const longestSerie = data.filter(elem => elem.length === maxArrLength)[0];
  const labels = longestSerie.map((_, i) => i);

  const datasets = data.map((data, i) => {
    const color = `rgb(${getColor()}, ${getColor()}, ${getColor()})`; //"rgb(255, 99, 132)"
    return {
      label: `Serie ${i + 1}`,
      backgroundColor: color,
      borderColor: color,
      data,
      fill: false
    };
  });

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {}
  });
}

(() => {
  const firebaseConfig = {
    apiKey: 'apikey',
    authDomain: 'domain',
    databaseURL: 'url'
    projectId: 'projectid',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  // Initialize Firebase
  !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

  const database = firebase.database();

  username.value = 'Barberto';

  buttonRipple.listen('click', async () => {
    if (username.value.length <= 0) return;

    if (chart) chart.destroy();

    select.selectedIndex = 0;
    oldSelectValue = '';

    const values = await database.ref(`/${username.value}`).once('value');

    if (values.hasChildren()) populateDropdown(values);
    else alert('no');
  });
})();
