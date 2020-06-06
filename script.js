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

// Draw the chart
function renderChart() {
  var readSets = meterData.readMeter.ReadSet;
  var chartData = new Array(readSets.length);
  for (var i = 0; i < readSets.length; i++) {
    var setData = readSets[i].ReadData;
    chartData[i] = new Array(3);
    chartData[i][0] = [];
    chartData[i][1] = [];
    chartData[i][2] = [];
    for (var j = 0; j < setData.length; j++) {
      chartData[i][0].push({
        "date": setData[j].Time_Stamp_UTC_ms,
        "pulses": setData[j].Pulse_Cnt_1
      });
      chartData[i][1].push({
        "date": setData[j].Time_Stamp_UTC_ms,
        "pulses": setData[j].Pulse_Cnt_2
      });
      chartData[i][2].push({
        "date": setData[j].Time_Stamp_UTC_ms,
        "pulses": setData[j].Pulse_Cnt_3
      });
    }
  }
  chartData[0][0].sort(function(a,b) {
    return (a.date - b.date)
  });
  chartData[0][1].sort(function(a,b) {
    return (a.date - b.date)
  });
  chartData[0][2].sort(function(a,b) {
    return (a.date - b.date)
  });
  chartData[1][0].sort(function(a,b) {
    return (a.date - b.date)
  });
  chartData[1][1].sort(function(a,b) {
    return (a.date - b.date)
  });

  var chart = am4core.create("chartdiv", am4charts.XYChart);
  chart.dateFormatter.inputDateFormat = "x";
  //chart.cursor = new am4charts.XYCursor();

  var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
  dateAxis.dataFields.date = "date";
  dateAxis.title.text = "Date-Time";
/*
  dateAxis.dateFormats.setKey("minute", "MMM dd\nHH:mm");
  dateAxis.periodChangeDateFormats.setKey("minute", "MMM dd\nHH:mm");
*/
  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
  valueAxis.title.text = "Pulses";

  var series1 = chart.series.push(new am4charts.LineSeries());
  series1.dataFields.valueY = "pulses";
  series1.dataFields.dateX = "date";
  //series.dataFields.valueX = "date";
  series1.tooltipText = "{valueX.formatNumber('#.00')}: {valueY.formatNumber('#.00')}";
  series1.data = chartData[0][0];

  var bullet = series1.bullets.push(new am4charts.Bullet());
  var square = bullet.createChild(am4core.Rectangle);
  square.width = 10;
  square.height = 10;
  square.horizontalCenter = "middle";
  square.verticalCenter = "middle";

  var series2 = chart.series.push(new am4charts.LineSeries());
  series2.dataFields.valueY = "pulses";
  series2.dataFields.dateX = "date";
  series2.tooltipText = "{dateX.formatDate('yyyy-mm')}: {valueY.formatNumber('#.00')}";
  series2.data = chartData[0][1];
  series2.bullets.push(bullet);

  var series3 = chart.series.push(new am4charts.LineSeries());
  series3.dataFields.valueY = "pulses";
  series3.dataFields.dateX = "date";
  series3.tooltipText = "{dateX.formatDate('yyyy-mm')}: {valueY.formatNumber('#.00')}";
  series3.data = chartData[0][2];
  series3.bullets.push(bullet);

  var series4 = chart.series.push(new am4charts.LineSeries());
  series4.dataFields.valueY = "pulses";
  series4.dataFields.dateX = "date";
  series4.tooltipText = "{dateX.formatDate('yyyy-mm')}: {valueY.formatNumber('#.00')}";
  series4.data = chartData[1][0];
  series4.bullets.push(bullet);

  var series5 = chart.series.push(new am4charts.LineSeries());
  series5.dataFields.valueY = "pulses";
  series5.dataFields.dateX = "date";
  series5.tooltipText = "{dateX.formatDate('yyyy-mm')}: {valueY.formatNumber('#.00')}";
  series5.data = chartData[1][1];
  series5.bullets.push(bullet);

  /*
  const chart_orig = AmCharts.makeChart( "chartdiv", {
    "type": "serial",
    "theme": "light",
    "dataProvider": [ {
      "month": "Jan",
      "visits": 2025
    }, {
      "month": "Feb",
      "visits": 1882
    }, {
      "month": "Mar",
      "visits": 1809
    }, {
      "month": "Apr",
      "visits": 1322
    }, {
      "month": "May",
      "visits": 1122
    }, {
      "month": "Jun",
      "visits": 1114
    }, {
      "month": "Jul",
      "visits": 984
    }, {
      "month": "Aug",
      "visits": 711
    }, {
      "month": "Sept",
      "visits": 665
    }, {
      "month": "Oct",
      "visits": 580
    } ],
    "valueAxes": [ {
      "gridColor": "#FFFFFF",
      "gridAlpha": 0.2,
      "dashLength": 0
    } ],
    "gridAboveGraphs": true,
    "startDuration": 1,
    "graphs": [ {
      "balloonText": "[[category]]: <b>[[value]]</b>",
      "fillAlphas": 0.8,
      "lineAlpha": 0.2,
      "type": "column",
      "valueField": "visits"
    } ],
    "chartCursor": {
      "categoryBalloonEnabled": false,
      "cursorAlpha": 0,
      "zoomable": false
    },
    "categoryField": "month",
    "categoryAxis": {
      "gridPosition": "start",
      "gridAlpha": 0,
      "tickPosition": "start",
      "tickLength": 20
    },
    "export": {
      "enabled": false
    }
  });
  */
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
  var request = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=json&cnt=10&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3';
  callApi(request, function(apiObject) {
    meterData = JSON.parse(apiObject);
    var testjson = JSON.stringify(meterData, null, 4);
    document.getElementById("card2").innerText = testjson;
    renderChart();
  });
}

function getMeterHtml() {
  var request = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=html&cnt=10&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3';
  callApi(request, function(apiObject) {
    //var testme = JSON.stringify(apiObject, null, 4);
    var testhtml = apiObject;
    document.getElementById("card1").innerHTML = testhtml;
  });
}
