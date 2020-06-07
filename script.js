/* Scripts for css grid dashboard */

$(document).ready(() => {
  addResizeListeners();
  setSidenavListeners();
  setUserDropdownListener();
  setMenuClickListener();
  setSidenavCloseListener();
  getMeterData();
  getMeterHtml();
  //renderChart();
});

// Set constants and grab needed elements
const sidenavEl = $('.sidenav');
const gridEl = $('.grid');
const SIDENAV_ACTIVE_CLASS = 'sidenav--active';
const GRID_NO_SCROLL_CLASS = 'grid--noscroll';
var meterData;

function toggleClass(el, className) {
  if (el.hasClass(className)) {
    el.removeClass(className);
  } else {
    el.addClass(className);
  }
}

// User avatar dropdown functionality
function setUserDropdownListener() {
  const userAvatar = $('.header__avatar');

  userAvatar.on('click', function(e) {
    const dropdown = $(this).children('.dropdown');
    toggleClass(dropdown, 'dropdown--active');
  });
}

// Sidenav list sliding functionality
function setSidenavListeners() {
  const subHeadings = $('.navList__subheading'); console.log('subHeadings: ', subHeadings);
  const SUBHEADING_OPEN_CLASS = 'navList__subheading--open';
  const SUBLIST_HIDDEN_CLASS = 'subList--hidden';

  subHeadings.each((i, subHeadingEl) => {
    $(subHeadingEl).on('click', (e) => {
      const subListEl = $(subHeadingEl).siblings();

      // Add/remove selected styles to list category heading
      if (subHeadingEl) {
        toggleClass($(subHeadingEl), SUBHEADING_OPEN_CLASS);
      }

      // Reveal/hide the sublist
      if (subListEl && subListEl.length === 1) {
        toggleClass($(subListEl), SUBLIST_HIDDEN_CLASS);
      }
    });
  });
}

function meterName(meter, pulse_cnt) {
  if (meter === "350002883") {
    if (pulse_cnt === 1) {
      return "301";
    } else if (pulse_cnt === 2) {
      return "303";
    } else if (pulse_cnt === 3) {
      return "305";
    }
  } else if (meter === "350002885") {
    if (pulse_cnt === 1) {
      return "307";
    } else if (pulse_cnt === 2) {
      return "Garden";
    }
  }
  return "?";
}

function meterColor(meter, pulse_cnt) {
  if (meter === "350002883") {
    if (pulse_cnt === 1) {
      return "#c70039"; //"301";
    } else if (pulse_cnt === 2) {
      return "#8abaf0"; //"303";
    } else if (pulse_cnt === 3) {
      return "#a26de1"; // "305";
    }
  } else if (meter === "350002885") {
    if (pulse_cnt === 1) {
      return "#98d356"; //"307";
    } else if (pulse_cnt === 2) {
      return "#814e25"; //"Garden";
    }
  }
  return "#000000";
}

// Draw the chart
function renderChart() {
  var readSets = meterData.readMeter.ReadSet;
  for (var i = 0; i < readSets.length; i++) {
    var setData = readSets[i].ReadData;
    setData.sort(function(a,b) {
      return (a.Time_Stamp_UTC_ms - b.Time_Stamp_UTC_ms)
    });
  }

  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.dateFormatter.inputDateFormat = "x";
  chart.cursor = new am4charts.XYCursor();
  chart.cursor.lineY.disabled = true;

  var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
  dateAxis.dataFields.date = "Time_Stamp_UTC_ms";
  dateAxis.title.text = "Date-Time";
/*
  dateAxis.dateFormats.setKey("minute", "MMM dd\nHH:mm");
  dateAxis.periodChangeDateFormats.setKey("minute", "MMM dd\nHH:mm");
*/
  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.title.text = "Pulses";
  valueAxis.cursorTooltipEnabled = false;

  var series1 = chart.series.push(new am4charts.LineSeries());
  series1.name = meterName(readSets[0].Meter, 1);
  var strokeColor = meterColor(readSets[0].Meter, 1);
  series1.stroke = am4core.color(strokeColor);
  series1.fill = am4core.color(strokeColor);
  series1.dataFields.dateX = "Time_Stamp_UTC_ms";
  series1.dataFields.valueY = "Pulse_Cnt_1";
  series1.tooltipText = "{name}: {valueY.formatNumber('#.')}";
  series1.data = readSets[0].ReadData;

  var bullet = series1.bullets.push(new am4charts.Bullet());
  var square = bullet.createChild(am4core.Rectangle);
  square.width = 10;
  square.height = 10;
  square.horizontalCenter = "middle";
  square.verticalCenter = "middle";

  var series2 = chart.series.push(new am4charts.LineSeries());
  series2.name = meterName(readSets[0].Meter, 2);
  strokeColor = meterColor(readSets[0].Meter, 2);
  series2.stroke = am4core.color(strokeColor);
  series2.fill = am4core.color(strokeColor);
  series2.dataFields.dateX = "Time_Stamp_UTC_ms";
  series2.dataFields.valueY = "Pulse_Cnt_2";
  series2.tooltipText = "{name}: {valueY.formatNumber('#.')}";
  series2.data = readSets[0].ReadData;
  series2.bullets.push(bullet);

  var series3 = chart.series.push(new am4charts.LineSeries());
  series3.name = meterName(readSets[0].Meter, 3);
  strokeColor = meterColor(readSets[0].Meter, 3);
  series3.stroke = am4core.color(strokeColor);
  series3.fill = am4core.color(strokeColor);
  series3.dataFields.dateX = "Time_Stamp_UTC_ms";
  series3.dataFields.valueY = "Pulse_Cnt_3";
  series3.tooltipText = "{name}: {valueY.formatNumber('#.')}";
  series3.data = readSets[0].ReadData;
  series3.bullets.push(bullet);

  var series4 = chart.series.push(new am4charts.LineSeries());
  series4.name = meterName(readSets[1].Meter, 1);
  strokeColor = meterColor(readSets[1].Meter, 1);
  series4.stroke = am4core.color(strokeColor);
  series4.fill = am4core.color(strokeColor);
  series4.dataFields.dateX = "Time_Stamp_UTC_ms";
  series4.dataFields.valueY = "Pulse_Cnt_1";
  series4.tooltipText = "{name}: {valueY.formatNumber('#.')}";
  series4.data = readSets[1].ReadData;
  series4.bullets.push(bullet);

  var series5 = chart.series.push(new am4charts.LineSeries());
  series5.name = meterName(readSets[1].Meter, 2);
  strokeColor = meterColor(readSets[1].Meter, 2);
  series5.stroke = am4core.color(strokeColor);
  series5.fill = am4core.color(strokeColor);
  series5.dataFields.dateX = "Time_Stamp_UTC_ms";
  series5.dataFields.valueY = "Pulse_Cnt_2";
  series5.tooltipText = "{name}: {valueY.formatNumber('#.')}";
  series5.data = readSets[1].ReadData;
  series5.bullets.push(bullet);
}

function toggleClass(el, className) {
  if (el.hasClass(className)) {
    el.removeClass(className);
  } else {
    el.addClass(className);
  }
}

// If user opens the menu and then expands the viewport from mobile size without closing the menu,
// make sure scrolling is enabled again and that sidenav active class is removed
function addResizeListeners() {
  $(window).resize(function(e) {
    const width = window.innerWidth; console.log('width: ', width);

    if (width > 750) {
      sidenavEl.removeClass(SIDENAV_ACTIVE_CLASS);
      gridEl.removeClass(GRID_NO_SCROLL_CLASS);
    }
  });
}

// Menu open sidenav icon, shown only on mobile
function setMenuClickListener() {
  $('.header__menu').on('click', function(e) { console.log('clicked menu icon');
    toggleClass(sidenavEl, SIDENAV_ACTIVE_CLASS);
    toggleClass(gridEl, GRID_NO_SCROLL_CLASS);
  });
}

// Sidenav close icon
function setSidenavCloseListener() {
  $('.sidenav__brand-close').on('click', function(e) {
    toggleClass(sidenavEl, SIDENAV_ACTIVE_CLASS);
    toggleClass(gridEl, GRID_NO_SCROLL_CLASS);
  });
}

// This code accesses the apiRequest URL and converts
// the contents to a usable JSON object named apiObject
function callApi(apiRequest,callback) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        //var jsonObject = JSON.parse(xhttp.responseText);
        callback(xhttp.responseText);
      }
    };
    xhttp.open("GET", apiRequest, true);
    xhttp.send();
}

function getMeterData() {
  var request = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=json&cnt=15&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3';
  callApi(request, function(apiObject) {
    meterData = JSON.parse(apiObject);
    var testjson = JSON.stringify(meterData, null, 4);
    //document.getElementById("card2").innerText = testjson;
    renderChart();
  });
}

function getMeterHtml() {
  var request = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=html&cnt=15&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3';
  callApi(request, function(apiObject) {
    //var testme = JSON.stringify(apiObject, null, 4);
    var testhtml = apiObject;
    //document.getElementById("card1").innerHTML = testhtml;
  });
}
