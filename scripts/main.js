(function (window) {
  'use strict';
  var App = window.App;
  var Settings = App.Settings;
  var DataStore = App.DataStore;

  let dataStore = new DataStore();
  let settings = new Settings();
  const chartdivs = ["chartdiv1", "chartdiv2", "chartdiv3",
    "chartdiv4", "chartdiv5", "chartdiv6"];

  $(document).ready(() => {
    console.log("main.js document ready");
    setupFormElements();
    getWaterData();
    getWeatherData();
  });

  function setupFormElements() {
    const options = ["Minutes", "Days"];

    chartdivs.forEach(function (chartdiv, index) {
      const header = cardHeaderForChart(chartdiv);
      const headerLinks = optionLinksForChart(chartdiv);
      const cs = settings.charts.get(chartdiv);
      if (cs.mode !== 'portions') {
        for (let i = 0; i < headerLinks.length; i++) {
          const optionText = i < options.length ? options[i] : '';
          headerLinks[i].innerText = optionText;
          headerLinks[i].onclick = optionText.length > 0 ?
            function() { setGraphMode(chartdiv, optionText); } : null;
        }
      } else if (headerLinks.length > 1) {
        const headerLink0 = headerLinks[0];
        const headerLink1 = headerLinks[1];
        const dateInput0 = document.createElement('input');
        dateInput0.setAttribute('type', 'date');
        dateInput0.setAttribute('id', chartdiv + '_dateInput0');
        dateInput0.addEventListener('change', handleSummaryPortionsChartDateChange);
        header.replaceChild(dateInput0, headerLink0);
        const dateInput1 = document.createElement('input');
        dateInput1.setAttribute('type', 'date');
        dateInput1.setAttribute('id', chartdiv + '_dateInput1');
        dateInput1.addEventListener('change', handleSummaryPortionsChartDateChange);
        header.replaceChild(dateInput1, headerLink1);
      }
    });

    const refreshLinks = document.getElementsByClassName('sidenav__brand-link');
    if (refreshLinks && refreshLinks.length > 0) {
      const refreshLink = refreshLinks[0];
      refreshLink.onclick = function () { refreshData(); };
    }
  }

  function cardHeaderForChart(chartdiv) {
    const chartCard = document.getElementById(chartdiv).parentNode.parentNode;
    return chartCard.querySelector('.card__header');
  }

  function optionLinksForChart(chartdiv) {
    const cardHeader = cardHeaderForChart(chartdiv);
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

    dataStore.updateWaterData(function() {
      // Realtime data callback
      let timestamp = dataStore.getRealtimeDataTimestamp();
      if (timestamp) {
        let updateField = document.getElementById("welcome_subtitle");
        updateField.innerHTML = "Data updated: " + timestamp.toLocaleString();
      }
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
      // Summary data callback
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
      renderSummaryPortionsChart("chartdiv6");
    });
  }

  function refreshData() {
    getWaterData();
    getWeatherData();
  }

  function getWeatherData() {
    dataStore.updateWeatherData(function(apiObject) {
      let weatherData = dataStore.getRealtimeWeatherData();
      let tempField = document.getElementById("local_temp");
      let descField = document.getElementById("local_desc");
      let descSpan = document.getElementById("local_desc_span");
      if (weatherData.imperial && weatherData.imperial.temp) {
        let temp = Number.parseFloat(weatherData.imperial.temp).toFixed(1);
        tempField.innerHTML = temp.toString() + "&deg";
      } else {
        tempField.innerHTML = "?";
      }
      if (weatherData.stationURL) {
        var link = document.createElement('a');
        link.setAttribute('href', weatherData.stationURL);
        link.innerHTML = descSpan.innerHTML;
        descField.replaceChild(link, descSpan);
      }
    });
  }

  function renderRealtimeChart(meter, pulseNum, chartdiv) {
    let entries = dataStore.getRealtimeEntriesForMeter(meter);
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
    dateAxis.title.fontSize = 16;
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

  Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
  };

  function renderSummaryChart(meterId, pulseNum, chartdiv) {
    let entries = dataStore.getSummaryEntriesForMeter(meterId);
    let volField = pulseNum === 2 ? "Volume_2_Diff" :
      pulseNum === 3 ? "Volume_3_Diff" : "Volume_1_Diff";
    let chartCard = document.getElementById(chartdiv).parentNode;
    let cardHeader = chartCard.parentNode.querySelector('.card__header');
    let totalUse = dataStore.summaryTotalForMeterField(meterId, volField);

    var chart = getChartByContainerId(chartdiv);
    if (chart) {
      chart.dispose();
    }
    chart = am4core.create(chartdiv, am4charts.XYChart);
    chart.dateFormatter.inputDateFormat = "x";
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.disabled = true;

    var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    let totalDays = dataStore.summaryDayCountForMeter(meterId);
    dateAxis.dataFields.date = "End_Time_Stamp_UTC_ms";
    dateAxis.title.text = "Past " + totalDays + (totalDays != 1 ? " days" : " day");
    dateAxis.title.fontSize = 16;
  /*
    dateAxis.dateFormats.setKey("minute", "MMM dd\nHH:mm");
    dateAxis.periodChangeDateFormats.setKey("minute", "MMM dd\nHH:mm");
  */
    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Gallons";
    valueAxis.cursorTooltipEnabled = false;

    var series = chart.series.push(new am4charts.ColumnSeries());
    series.name = meterName(meterId, pulseNum);
    var strokeColor = meterColor(meterId, pulseNum);
    series.stroke = am4core.color(strokeColor);
    series.fill = am4core.color(strokeColor);
    series.dataFields.dateX = "End_Time_Stamp_UTC_ms";
    series.dataFields.valueY = volField;
    series.tooltipText = "{valueY.formatNumber('#.00')}";
    series.data = entries;
/*
    if (readSets[meterIdx].ReadData.length > 0) {
      currentUse = readSets[meterIdx].ReadData[readSets[meterIdx].ReadData.length-1][pulseField];
    }
*/
/*
    const firstEntry = dataStore.firstSummaryEntryForMeter(meterId);
    const lastEntry = dataStore.lastSummaryEntryForMeter(meterId);
    const firstDate = new Date(firstEntry.Start_Time_Stamp_UTC_ms);
    const lastDate = new Date(lastEntry.End_Time_Stamp_UTC_ms);
    const startDate = firstDate.addDays(1);
    const endDate = lastDate.addDays(-1);
    let subrange = dataStore.getSummaryRangeForMeter(meterId, startDate, endDate);
*/
    if (cardHeader) {
      let cardTitle = cardHeader.querySelector('.card__header-title');
      let status = cardHeader.querySelector('.card__header-status');
      cardTitle.innerHTML = "<strong>" + series.name + "</strong>";
      status.innerHTML= "Total Use: <strong>" + formatVolume(totalUse) + "</strong> gal";
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

  function renderSummaryPortionsChart(chartdiv) {
    const chartCard = document.getElementById(chartdiv).parentNode;
    const cardHeader = chartCard.parentNode.querySelector('.card__header');
    const dateInput0 = document.getElementById(chartdiv + '_dateInput0');
    const dateInput1 = document.getElementById(chartdiv + '_dateInput1');

//Mon Nov 30 2020 16:00:00 GMT-0800
//Fri Dec 04 2020 16:00:00 GMT-0800
// Garden: 647.06
// 301: 309.70
// 303: 338.87 (-1.5 for 12/5)
// 305: 371.03
// 307: 210.20
    var firstDate = dateInput0 && dateInput0.value ?
      startDateFromDateString(dateInput0.value) : null;
    var lastDate = dateInput1 && dateInput1.value ?
      endDateFromDateString(dateInput1.value) : null;

    let chartData = [];
    for (let [unitId, us] of settings.units) {
      let volField = us.pulse === 1 ? "Volume_1_Diff" : us.pulse === 2 ? "Volume_2_Diff" :
        us.pulse === 3 ? "Volume_3_Diff" : null;
      let dataPoint = {
        "unit": unitId,
        "data": dataStore.summaryTotalForMeterField(us.meterId, volField, firstDate, lastDate),
        "color": meterColor(us.meterId, us.pulse)
      };
      chartData.push(dataPoint);
    }

    var chart = getChartByContainerId(chartdiv);
    if (chart) {
      chart.dispose();
    }
    chart = am4core.create(chartdiv, am4charts.PieChart);
    let pieSeries = chart.series.push(new am4charts.PieSeries());
    chart.data = chartData;
    chart.innerRadius = am4core.percent(33);

    firstDate = firstDate || new Date(dataStore.earliestSummaryTimestamp()); //Fri Nov 06 2020 23:59:59 GMT-0800
    lastDate = lastDate || new Date(dataStore.latestSummaryTimestamp()); //Sat Dec 05 2020 23:59:59 GMT-0800
    const firstDateStr = firstDate.toLocaleDateString();
    const lastDateStr = lastDate.toLocaleDateString();

    let label = chart.chartContainer.createChild(am4core.Label);
    label.text = firstDateStr + " to " + lastDateStr;
    label.align = "center";
    label.fontSize = 16;
    label.x = am4core.percent(50);
    label.y = am4core.percent(92.5);

    pieSeries.dataFields.value = "data";
    pieSeries.dataFields.category = "unit";
    pieSeries.slices.template.propertyFields.fill = "color";
    pieSeries.slices.template.stroke = am4core.color("#ffffff");
    pieSeries.slices.template.strokeWidth = 2;
    pieSeries.slices.template.strokeOpacity = 1;
    pieSeries.slices.template.tooltipText = "{category}: {value.percent.formatNumber('#.0')}% ({value.formatNumber('#.00')})";

    if (cardHeader) {
      let cardTitle = cardHeader.querySelector('.card__header-title');
      cardTitle.innerHTML = "<strong>Total</strong> Water Use";
      dateInput0.setAttribute('value', formatDateInputValue(firstDate));
      dateInput1.setAttribute('value', formatDateInputValue(lastDate));
    }
  }

  function handleSummaryPortionsChartDateChange(e) {
    const chartdiv = e.target.id.slice(0, e.target.id.indexOf('_'));
    if (chartdiv) {
      const dateInput0 = document.getElementById(chartdiv + '_dateInput0');
      const dateInput1 = document.getElementById(chartdiv + '_dateInput1');
      const reqFirstDate = dateInput0 && dateInput0.value ?
        startDateFromDateString(dateInput0.value) : null;
      const reqLastDate = dateInput1 && dateInput1.value ?
        endDateFromDateString(dateInput1.value) : null;

      if (reqFirstDate && reqLastDate) {
        // Compare requested vs current range, ignoring time
        const curFirstDate = new Date(dataStore.earliestSummaryTimestamp());
        const curLastDate = new Date(dataStore.latestSummaryTimestamp());
        if ((reqFirstDate.setHours(0,0,0,0) < curFirstDate.setHours(0,0,0,0)) ||
            (reqLastDate.setHours(0,0,0,0) > curLastDate.setHours(0,0,0,0))) {
          dataStore.updateSummaryWaterData(function() {
            renderSummaryPortionsChart(chartdiv);
          }, reqFirstDate, reqLastDate);
        } else {
          renderSummaryPortionsChart(chartdiv);
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

  function getUnitId(meterId, pulse) {
    for (let [unitId, us] of settings.units) {
      if (us.meterId == meterId && us.pulse == pulse) {
        return unitId;
      }
    }
  }

  function meterName(meterId, pulse) {
    if (meterId === "350002883") {
      if (pulse === 1) {
        return "301";
      } else if (pulse === 2) {
        return "303";
      } else if (pulse === 3) {
        return "305";
      }
    } else if (meterId === "350002885") {
      if (pulse === 1) {
        return "307";
      } else if (pulse === 2) {
        return "Garden";
      }
    }
    return "?";
  }

  function meterColor(meterId, pulse) {
    if (meterId === "350002883") {
      if (pulse === 1) {
        return "#c70039"; //"301";
      } else if (pulse === 2) {
        return "#8abaf0"; //"303";
      } else if (pulse === 3) {
        return "#a26de1"; // "305";
      }
    } else if (meterId === "350002885") {
      if (pulse === 1) {
        return "#98d356"; //"307";
      } else if (pulse === 2) {
        return "#814e25"; //"Garden";
      }
    }
    return "#000000";
  }

  function summaryVolumeDifferenceForUnit(unitId) {
    const unitSettings = settings.units.get(unitId);
    const meterId = unitSettings.meterId;
    const pulseNum = unitSettings.pulse;
    if (meterId && pulseNum) {
      const volField = pulseNum === 2 ? "Volume_2_Diff" :
        pulseNum === 3 ? "Volume_3_Diff" : "Volume_1_Diff";
      return dataStore.summaryTotalForMeterField(meterId, volField);
    }
    return 0;
  }

  function formatVolume(volume) {
    if (!volume || volume == 0) {
      return "0";
    }
    return volume.toFixed(2);
  }

  function formatDateInputValue(date) {
    const d = date || Date();
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }
    return [year, month, day].join('-');
  }

  function startDateFromDateString(dateString) {
    const utcDate = new Date(dateString);
    var date = new Date();
    date.setYear(utcDate.getUTCFullYear());
    date.setMonth(utcDate.getUTCMonth());
    date.setDate(utcDate.getUTCDate());
    date.setHours(0,0,0,0);
    return date;
  }

  function endDateFromDateString(dateString) {
    const utcDate = new Date(dateString);
    var date = new Date();
    date.setYear(utcDate.getUTCFullYear());
    date.setMonth(utcDate.getUTCMonth());
    date.setDate(utcDate.getUTCDate());
    date.setHours(23,59,59,999);
    return date;
  }

})(window);
