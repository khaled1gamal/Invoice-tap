let btncalc = document.getElementById('btncalc');
let invoice = document.getElementById('invoice');
let alhsab = document.getElementById('alhsab');
let fprice = document.getElementById('fprice');
let afterDic = document.getElementById('afterDic');
let total = 0;
let lPrice = document.getElementById('lPrice');
let lPrice2 = document.getElementById('lPrice2');
let lPrice3 = document.getElementById('lPrice3');
let lensPrice = document.getElementById('lensPrice');
let total2 = document.getElementById('total2');
let lens3Price = document.getElementById('lens3Price');

btncalc.onclick = function(){
  invoice.classList.add('haid');
  alhsab.classList.remove('haid');
  let total = +fprice.value * 0.75;
  afterDic.innerHTML = total;
  lensPrice.innerHTML = +lPrice.value + +lPrice2.value;
  lens3Price.innerHTML = lPrice3.value;
  total2.innerHTML = +total + +lPrice3.value + +lPrice2.value + +lPrice.value;
}

let send = document.getElementById('send');
let done = document.getElementById('done');

send.onclick = function(){
  alhsab.classList.add('haid');
  done.classList.remove('haid');
}

let home = document.getElementById('home');

home.onclick = function(){
  done.classList.add('haid');
  invoice.classList.remove('haid');
}

let back = document.getElementById('back');

back.onclick = function(){
  alhsab.classList.add('haid');
  invoice.classList.remove('haid');
}

