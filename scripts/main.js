(function (window) {
  'use strict';
  var App = window.App;
  var DataStore = App.DataStore;

  let dataStore = new DataStore();
  let settings = {};

  $(document).ready(() => {
    console.log("main.js document ready");
    initializeSettings();
    getMeterData();
    getWeatherData();
  });

  function initializeSettings() {
    settings = {};
    settings.charts = new Map([
      [ "chartdiv1", { meter: "350002885", pulse: 2, mode: "days" } ],
      [ "chartdiv2", { meter: "350002883", pulse: 1, mode: "minutes" } ],
      [ "chartdiv3", { meter: "350002883", pulse: 2, mode: "days" } ],
      [ "chartdiv4", { meter: "350002883", pulse: 3, mode: "minutes" } ],
      [ "chartdiv5", { meter: "350002885", pulse: 1, mode: "days" } ]
    ]);
  }

  function meterPulseForChartDiv(chartdiv) {
    let entry = settings.charts.get(chartdiv);
    return entry && entry.meter && entry.pulse ?
      { meter: entry.meter, pulse: entry.pulse } : null;
  }

  function getMeterData() {
    const defMode = "minutes";
    const mp1 = meterPulseForChartDiv("chartdiv1");
    const mp2 = meterPulseForChartDiv("chartdiv2");
    const mp3 = meterPulseForChartDiv("chartdiv3");
    const mp4 = meterPulseForChartDiv("chartdiv4");
    const mp5 = meterPulseForChartDiv("chartdiv5");
    const mode1 = settings.charts.get("chartdiv1").mode || defMode;
    const mode2 = settings.charts.get("chartdiv2").mode || defMode;
    const mode3 = settings.charts.get("chartdiv3").mode || defMode;
    const mode4 = settings.charts.get("chartdiv4").mode || defMode;
    const mode5 = settings.charts.get("chartdiv5").mode || defMode;

    dataStore.getWaterData(function() {
      if (mp1 && mode1 === "minutes") {
        renderRealtimeChart(mp1.meter, mp1.pulse, "chartdiv1");
      }
      if (mp2 && mode2 === "minutes") {
        renderRealtimeChart(mp2.meter, mp2.pulse, "chartdiv2");
      }
      if (mp3 && mode3 === "minutes") {
        renderRealtimeChart(mp3.meter, mp3.pulse, "chartdiv3");
      }
      if (mp4 && mode4 === "minutes") {
        renderRealtimeChart(mp4.meter, mp4.pulse, "chartdiv4");
      }
      if (mp5 && mode5 === "minutes") {
        renderRealtimeChart(mp5.meter, mp5.pulse, "chartdiv5");
      }
    }, function() {
      if (mp1 && mode1 === "days") {
        renderSummaryChart(mp1.meter, mp1.pulse, "chartdiv1");
      }
      if (mp2 && mode2 === "days") {
        renderSummaryChart(mp2.meter, mp2.pulse, "chartdiv2");
      }
      if (mp3 && mode3 === "days") {
        renderSummaryChart(mp3.meter, mp3.pulse, "chartdiv3");
      }
      if (mp4 && mode4 === "days") {
        renderSummaryChart(mp4.meter, mp4.pulse, "chartdiv4");
      }
      if (mp5 && mode5 === "days") {
        renderSummaryChart(mp5.meter, mp5.pulse, "chartdiv5");
      }
    });
  }

  function getWeatherData() {
    dataStore.getWeatherData(function(apiObject) {
      let tempField = document.getElementById("local_temp");
      let temp = Math.round(dataStore.data.weatherData.current.temp);
      tempField.innerHTML = temp.toString() + "&deg";
    });
  }

  function renderRealtimeChart(meter, pulse_cnt, chartdiv) {
    let readSets = dataStore.data.waterData.realtimeData.readMeter.ReadSet;
    let meterIdx = meter === "350002883" ? 0 : meter === "350002885" ? 1 : 0;
    let pulseField = pulse_cnt === 1 ? "Volume_1_Diff" :
      pulse_cnt === 2 ? "Volume_2_Diff" : pulse_cnt === 3 ? "Volume_3_Diff" : "Volume_1_Diff";
    let chartCard = document.getElementById(chartdiv).parentNode;
    let cardHeader = chartCard.parentNode.querySelector('.card__header');
    let currentUse = 0;

    //var testval = DataStore.getVolumeFromPulseCount(0);

    var chart = am4core.create(chartdiv, am4charts.XYChart);
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
    series.name = meterName(readSets[meterIdx].Meter, pulse_cnt);
    var strokeColor = meterColor(readSets[meterIdx].Meter, pulse_cnt);
    series.stroke = am4core.color(strokeColor);
    series.fill = am4core.color(strokeColor);
    series.dataFields.dateX = "Time_Stamp_UTC_ms";
    series.dataFields.valueY = pulseField;
    series.tooltipText = "{valueY.formatNumber('#.00')}";
    series.data = readSets[meterIdx].ReadData;

    if (readSets[meterIdx].ReadData.length > 0) {
      currentUse = readSets[meterIdx].ReadData[readSets[meterIdx].ReadData.length-1][pulseField];
    }

    if (cardHeader) {
      let cardTitle = cardHeader.querySelector('.card__header-title');
      let status = cardHeader.querySelector('.card__header-status');
      cardTitle.innerHTML = "<strong>" + series.name + "</strong>";
      status.innerHTML= "Current Use: <strong>" + currentUse + "</strong> gal";
    }
  }

  function renderSummaryChart(meter, pulse_cnt, chartdiv) {
    let entries = dataStore.data.waterData.summaryData.get(meter);
    let meterIdx = meter === "350002883" ? 0 : meter === "350002885" ? 1 : 0;
    let pulseField = pulse_cnt === 2 ? "Pulse_Cnt_2_Diff" :
      pulse_cnt === 3 ? "Pulse_Cnt_3_Diff" : "Pulse_Cnt_1_Diff";
    let chartCard = document.getElementById(chartdiv).parentNode;
    let cardHeader = chartCard.parentNode.querySelector('.card__header');
    let currentUse = 0;

    //var testval = DataStore.getVolumeFromPulseCount(0);

    var chart = am4core.create(chartdiv, am4charts.XYChart);
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
    series.name = meterName(meter, pulse_cnt);
    var strokeColor = meterColor(meter, pulse_cnt);
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

})(window);
