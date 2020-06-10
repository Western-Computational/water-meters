(function (window) {
  'use strict';
  var App = window.App;
  var DataStore = App.DataStore;

  let dataStore = new DataStore();

  $(document).ready(() => {
    console.log("main.js document ready");
    getMeterData();
    getWeatherData();
  });

  function getMeterData() {
    dataStore.getWaterData(function() {
      renderRealtimeChart("350002885", 2, "chartdiv1");
      renderRealtimeChart("350002883", 1, "chartdiv2");
      renderRealtimeChart("350002883", 2, "chartdiv3");
      renderRealtimeChart("350002883", 3, "chartdiv4");
      renderRealtimeChart("350002885", 1, "chartdiv5");
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
    let cardHeader = chartCard.parentNode.querySelector('.card__header-title');

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

    if (cardHeader) {
      cardHeader.innerHTML = "<strong>" + series.name + "</strong>";
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

  // Draw the chart
  function renderChart() {
    var readSets = data.data.waterData.realtimeData.readMeter.ReadSet;

    var chart = am4core.create("chartdiv1", am4charts.XYChart);
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
    //series1.dataFields.valueY = "Pulse_Cnt_1";
    series1.dataFields.valueY = "Pulse_Cnt_1_Diff";
    series1.tooltipText = "{name}: {valueY.formatNumber('#.')}";
    series1.data = readSets[0].ReadData;

  /*
    var bullet = series1.bullets.push(new am4charts.Bullet());
    var square = bullet.createChild(am4core.Rectangle);
    square.width = 10;
    square.height = 10;
    square.horizontalCenter = "middle";
    square.verticalCenter = "middle";
  */
    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.name = meterName(readSets[0].Meter, 2);
    strokeColor = meterColor(readSets[0].Meter, 2);
    series2.stroke = am4core.color(strokeColor);
    series2.fill = am4core.color(strokeColor);
    series2.dataFields.dateX = "Time_Stamp_UTC_ms";
    //series2.dataFields.valueY = "Pulse_Cnt_2";
    series2.dataFields.valueY = "Pulse_Cnt_2_Diff";
    series2.tooltipText = "{name}: {valueY.formatNumber('#.')}";
    series2.data = readSets[0].ReadData;
    //series2.bullets.push(bullet);

    var series3 = chart.series.push(new am4charts.LineSeries());
    series3.name = meterName(readSets[0].Meter, 3);
    strokeColor = meterColor(readSets[0].Meter, 3);
    series3.stroke = am4core.color(strokeColor);
    series3.fill = am4core.color(strokeColor);
    series3.dataFields.dateX = "Time_Stamp_UTC_ms";
    //series3.dataFields.valueY = "Pulse_Cnt_3";
    series3.dataFields.valueY = "Pulse_Cnt_3_Diff";
    series3.tooltipText = "{name}: {valueY.formatNumber('#.')}";
    series3.data = readSets[0].ReadData;
    //series3.bullets.push(bullet);

    var series4 = chart.series.push(new am4charts.LineSeries());
    series4.name = meterName(readSets[1].Meter, 1);
    strokeColor = meterColor(readSets[1].Meter, 1);
    series4.stroke = am4core.color(strokeColor);
    series4.fill = am4core.color(strokeColor);
    series4.dataFields.dateX = "Time_Stamp_UTC_ms";
    //series4.dataFields.valueY = "Pulse_Cnt_1";
    series4.dataFields.valueY = "Pulse_Cnt_1_Diff";
    series4.tooltipText = "{name}: {valueY.formatNumber('#.')}";
    series4.data = readSets[1].ReadData;
    //series4.bullets.push(bullet);

    var series5 = chart.series.push(new am4charts.LineSeries());
    series5.name = meterName(readSets[1].Meter, 2);
    strokeColor = meterColor(readSets[1].Meter, 2);
    series5.stroke = am4core.color(strokeColor);
    series5.fill = am4core.color(strokeColor);
    series5.dataFields.dateX = "Time_Stamp_UTC_ms";
    //series5.dataFields.valueY = "Pulse_Cnt_2";
    series5.dataFields.valueY = "Pulse_Cnt_2_Diff";
    series5.tooltipText = "{name}: {valueY.formatNumber('#.')}";
    series5.data = readSets[1].ReadData;
    //series5.bullets.push(bullet);
  }

})(window);
