(function (window) {
  'use strict';
  var App = window.App;
  var DataStore = App.DataStore;

  let dataStore = new DataStore();
  let settings = {};

  $(document).ready(() => {
    console.log("main.js document ready");
    initializeSettings();
    setupFormElements();
    getWaterData();
    getWeatherData();
  });

  function initializeSettings() {
    settings = {};
    settings.charts = new Map([
      [ "chartdiv1", { meter: "350002885", pulse: 2, mode: "minutes" } ],
      [ "chartdiv2", { meter: "350002883", pulse: 1, mode: "minutes" } ],
      [ "chartdiv3", { meter: "350002883", pulse: 2, mode: "minutes" } ],
      [ "chartdiv4", { meter: "350002883", pulse: 3, mode: "minutes" } ],
      [ "chartdiv5", { meter: "350002885", pulse: 1, mode: "minutes" } ]
    ]);
  }

  function setupFormElements() {
    const chartdivs = ["chartdiv1", "chartdiv2", "chartdiv3", "chartdiv4", "chartdiv5"];
    const options = ["Minutes", "Days"];

    chartdivs.forEach(function (chartdiv, index) {
      let headerLinks = optionLinksForChart(chartdiv);
      for (let i = 0; i < headerLinks.length; i++) {
        let optionText = i < options.length ? options[i] : '';
        headerLinks[i].innerText = optionText;
        headerLinks[i].onclick = function() { setGraphMode(chartdiv, optionText); };
      }
    });

    const refreshLinks = document.getElementsByClassName('sidenav__brand-link');
    if (refreshLinks && refreshLinks.length > 0) {
      const refreshLink = refreshLinks[0];
      refreshLink.onclick = function () { refreshData(); };
    }

  }

  function optionLinksForChart(chartdiv) {
    let chartCard = document.getElementById(chartdiv).parentNode.parentNode;
    let cardHeader = chartCard.querySelector('.card__header');
    return cardHeader.getElementsByClassName('card__header-link');
  }

  function optionLinkForChart(chartdiv, linkText) {
    let headerLinks = optionLinksForChart(chartdiv);
    for (let i = 0; i < headerLinks.length; i++) {
      if (headerLinks[i].innerText == linkText) {
        return headerLinks[i];
      }
    }
    return null;
  }

  function getWaterData() {
    const defMode = "minutes";
    const cs1 = settings.charts.get("chartdiv1");
    const cs2 = settings.charts.get("chartdiv2");
    const cs3 = settings.charts.get("chartdiv3");
    const cs4 = settings.charts.get("chartdiv4");
    const cs5 = settings.charts.get("chartdiv5");

    dataStore.getWaterData(function() {
      if (cs1.meter && cs1.pulse && (cs1.mode || defMode) === "minutes") {
        renderRealtimeChart(cs1.meter, cs1.pulse, "chartdiv1");
      }
      if (cs2.meter && cs2.pulse && (cs2.mode || defMode) === "minutes") {
        renderRealtimeChart(cs2.meter, cs2.pulse, "chartdiv2");
      }
      if (cs3.meter && cs3.pulse && (cs3.mode || defMode) === "minutes") {
        renderRealtimeChart(cs3.meter, cs3.pulse, "chartdiv3");
      }
      if (cs4.meter && cs4.pulse && (cs4.mode || defMode) === "minutes") {
        renderRealtimeChart(cs4.meter, cs4.pulse, "chartdiv4");
      }
      if (cs5.meter && cs5.pulse && (cs5.mode || defMode) === "minutes") {
        renderRealtimeChart(cs5.meter, cs5.pulse, "chartdiv5");
      }
    }, function() {
      if (cs1.meter && cs1.pulse && (cs1.mode || defMode) === "days") {
        renderSummaryChart(cs1.meter, cs1.pulse, "chartdiv1");
      }
      if (cs2.meter && cs2.pulse && (cs2.mode || defMode) === "days") {
        renderSummaryChart(cs2.meter, cs2.pulse, "chartdiv2");
      }
      if (cs3.meter && cs3.pulse && (cs3.mode || defMode) === "days") {
        renderSummaryChart(cs3.meter, cs3.pulse, "chartdiv3");
      }
      if (cs4.meter && cs4.pulse && (cs4.mode || defMode) === "days") {
        renderSummaryChart(cs4.meter, cs4.pulse, "chartdiv4");
      }
      if (cs5.meter && cs5.pulse && (cs5.mode || defMode) === "days") {
        renderSummaryChart(cs5.meter, cs5.pulse, "chartdiv5");
      }
    });
  }

  function refreshWaterData() {
    dataStore.updateWaterData(function() {

    }, function() {

    });
  }

  function refreshData() {
    refreshWaterData();
    getWeatherData();
  }

  function getWeatherData() {
    dataStore.getWeatherData(function(apiObject) {
      let tempField = document.getElementById("local_temp");
      let temp = Math.round(dataStore.data.weatherData.current.temp);
      tempField.innerHTML = temp.toString() + "&deg";
    });
  }

  function renderRealtimeChart(meter, pulseNum, chartdiv) {
    let entries = dataStore.getRealtimeDataForMeter(meter);
    let meterIdx = meter === "350002883" ? 0 : meter === "350002885" ? 1 : 0;
    let pulseField = pulseNum === 1 ? "Volume_1_Diff" :
      pulseNum === 2 ? "Volume_2_Diff" : pulseNum === 3 ? "Volume_3_Diff" : "Volume_1_Diff";
    let chartCard = document.getElementById(chartdiv).parentNode;
    let cardHeader = chartCard.parentNode.querySelector('.card__header');
    let currentUse = 0;

    var chart = getChartByContainerId(chartdiv);
    if (chart) {
      chart.dispose();
    }
    chart = am4core.create(chartdiv, am4charts.XYChart);
    chart.dateFormatter.inputDateFormat = "x";
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.disabled = true;

    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.dataFields.date = "Time_Stamp_UTC_ms";
    dateAxis.title.text = "Last 12 Hours";
  /*
    dateAxis.dateFormats.setKey("minute", "MMM dd\nHH:mm");
    dateAxis.periodChangeDateFormats.setKey("minute", "MMM dd\nHH:mm");
  */
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Gallons";
    valueAxis.cursorTooltipEnabled = false;

    var series = chart.series.push(new am4charts.ColumnSeries());
    series.name = meterName(meter, pulseNum);
    var strokeColor = meterColor(meter, pulseNum);
    series.stroke = am4core.color(strokeColor);
    series.fill = am4core.color(strokeColor);
    series.dataFields.dateX = "Time_Stamp_UTC_ms";
    series.dataFields.valueY = pulseField;
    series.tooltipText = "{valueY.formatNumber('#.00')}";
    series.data = entries;

    if (entries.length > 0) {
      currentUse = entries[entries.length-1][pulseField];
    }

    if (cardHeader) {
      let cardTitle = cardHeader.querySelector('.card__header-title');
      let status = cardHeader.querySelector('.card__header-status');
      cardTitle.innerHTML = "<strong>" + series.name + "</strong>";
      status.innerHTML= "Current Use: <strong>" + formatVolume(currentUse) + "</strong> gal";
      let headerLinks = optionLinksForChart(chartdiv);
      for (let i = 0; i < headerLinks.length; i++) {
        if (headerLinks[i].innerText == "Minutes") {
          headerLinks[i].classList.add('active');
        } else {
          headerLinks[i].classList.remove('active');
        }
      }
    }
  }

  function renderSummaryChart(meter, pulseNum, chartdiv) {
    let entries = dataStore.getSummaryDataForMeter(meter);
    let pulseField = pulseNum === 2 ? "Pulse_Cnt_2_Diff" :
      pulseNum === 3 ? "Pulse_Cnt_3_Diff" : "Pulse_Cnt_1_Diff";
    let chartCard = document.getElementById(chartdiv).parentNode;
    let cardHeader = chartCard.parentNode.querySelector('.card__header');
    let currentUse = 0;

    var chart = getChartByContainerId(chartdiv);
    if (chart) {
      chart.dispose();
    }
    chart = am4core.create(chartdiv, am4charts.XYChart);
    chart.dateFormatter.inputDateFormat = "x";
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.disabled = true;

    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.dataFields.date = "End_Time_Stamp_UTC_ms";
    dateAxis.title.text = "Past 60 days";
  /*
    dateAxis.dateFormats.setKey("minute", "MMM dd\nHH:mm");
    dateAxis.periodChangeDateFormats.setKey("minute", "MMM dd\nHH:mm");
  */
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Gallons";
    valueAxis.cursorTooltipEnabled = false;

    var series = chart.series.push(new am4charts.ColumnSeries());
    series.name = meterName(meter, pulseNum);
    var strokeColor = meterColor(meter, pulseNum);
    series.stroke = am4core.color(strokeColor);
    series.fill = am4core.color(strokeColor);
    series.dataFields.dateX = "End_Time_Stamp_UTC_ms";
    series.dataFields.valueY = pulseField;
    series.tooltipText = "{valueY.formatNumber('#.00')}";
    series.data = entries;
/*
    if (readSets[meterIdx].ReadData.length > 0) {
      currentUse = readSets[meterIdx].ReadData[readSets[meterIdx].ReadData.length-1][pulseField];
    }
*/
    if (cardHeader) {
      let cardTitle = cardHeader.querySelector('.card__header-title');
      let status = cardHeader.querySelector('.card__header-status');
      cardTitle.innerHTML = "<strong>" + series.name + "</strong>";
      status.innerHTML= "Current Use: <strong>" + currentUse + "</strong> gal";
      let headerLinks = optionLinksForChart(chartdiv);
      for (let i = 0; i < headerLinks.length; i++) {
        if (headerLinks[i].innerText == "Days") {
          headerLinks[i].classList.add('active');
        } else {
          headerLinks[i].classList.remove('active');
        }
      }
    }
  }

  function setGraphMode(chartdiv, optionText) {
    const cs = settings.charts.get(chartdiv);
    if (optionText === "Minutes" && cs.mode != "minutes") {
      cs.mode = "minutes";
      renderRealtimeChart(cs.meter, cs.pulse, chartdiv);
    } else if (optionText == "Days" && cs.mode != "days") {
      cs.mode = "days";
      renderSummaryChart(cs.meter, cs.pulse, chartdiv);
    }
  }

  function getChartByContainerId(id) {
    let charts = am4core.registry.baseSprites;
    for (let i = 0; i < charts.length; i++) {
      let c = charts[i].svgContainer;
      if (c.htmlElement.id == id) {
        return charts[i];
      }
    }
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

  function formatVolume(volume) {
    if (!volume || volume == 0) {
      return "0";
    }
    return volume.toFixed(2);
  }

})(window);
