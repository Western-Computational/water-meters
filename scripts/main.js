(function (window) {
  'use strict';
  var App = window.App;
  var DataStore = App.DataStore;

  let dataStore = new DataStore();
  let chartSettings = new Map([
    [ "chartdiv1", { mode: "days" } ],
    [ "chartdiv2", {} ],
    [ "chartdiv3", {} ],
    [ "chartdiv4", { mode: "days" } ],
    ["chartdiv5", {} ]
  ]);

  $(document).ready(() => {
    console.log("main.js document ready");
    getMeterData();
    getWeatherData();
  });

  function getMeterData() {
    const defMode = "minutes";
    const mode1 = chartSettings.get("chartdiv1").mode || defMode;
    const mode2 = chartSettings.get("chartdiv2").mode || defMode;
    const mode3 = chartSettings.get("chartdiv3").mode || defMode;
    const mode4 = chartSettings.get("chartdiv4").mode || defMode;
    const mode5 = chartSettings.get("chartdiv5").mode || defMode;

    dataStore.getWaterData(function() {
      if (mode1 === "minutes") {
        renderRealtimeChart("350002885", 2, "chartdiv1");
      }
      if (mode2 === "minutes") {
        renderRealtimeChart("350002883", 1, "chartdiv2");
      }
      if (mode3 === "minutes") {
        renderRealtimeChart("350002883", 2, "chartdiv3");
      }
      if (mode4 === "minutes") {
        renderRealtimeChart("350002883", 3, "chartdiv4");
      }
      if (mode5 === "minutes") {
        renderRealtimeChart("350002885", 1, "chartdiv5");
      }
    }, function() {
      if (mode1 === "days") {
        renderSummaryChart("350002885", 2, "chartdiv1");
      }
      if (mode2 === "days") {
        renderSummaryChart("350002883", 1, "chartdiv2");
      }
      if (mode3 === "days") {
        renderSummaryChart("350002883", 2, "chartdiv3");
      }
      if (mode4 === "days") {
        renderSummaryChart("350002883", 3, "chartdiv4");
      }
      if (mode5 === "days") {
        renderSummaryChart("350002885", 1, "chartdiv5");
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
