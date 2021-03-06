import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { ModalClose } from "react-modal-bootstrap";
import { Provider } from "react-redux";

import { DataViewerMenu } from "../../dtale/DataViewerMenu";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 500 });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementAtEvent = _evt => [{ _index: 0 }];
      chartCfg.update = _.noop;
      chartCfg.options = { scales: { xAxes: [{}] } };
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("DataViewer: coverage", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const CoverageChart = require("../../popups/CoverageChart").ReactCoverageChart;
    const CoverageChartBody = require("../../popups/CoverageChartBody").default;
    const PopupChart = require("../../popups/PopupChart").ReactPopupChart;

    const store = reduxUtils.createDtaleStore();
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML += '<input type="hidden" id="settings" value="" />';
    body.innerHTML += '<div id="content" style="height: 1000px;width: 1000px;"></div>';
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    setTimeout(() => {
      result.update();
      result
        .find("div.headerCell div")
        .last()
        .simulate("click");
      result.update();
      result
        .find(DataViewerMenu)
        .find("ul li button")
        .at(9)
        .simulate("click");
      result.update();
      t.ok(result.find(PopupChart).instance().props.chartData.visible, "should open coverage");
      result
        .find(PopupChart)
        .first()
        .find(ModalClose)
        .first()
        .simulate("click");
      result.update();
      t.notOk(result.find(PopupChart).instance().props.chartData.visible, "should close coverage");
      result.update();
      result
        .find(DataViewerMenu)
        .find("ul li button")
        .at(9)
        .simulate("click");
      result.update();
      result
        .find(CoverageChart)
        .find("div.scrollable-list")
        .first()
        .find("a")
        .last()
        .simulate("click");
      result.update();
      result
        .find(CoverageChart)
        .find("div.scrollable-list")
        .last()
        .find("a")
        .last()
        .simulate("click");
      result.update();
      result
        .find(CoverageChart)
        .find("button")
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.ok(result.find(CoverageChartBody).instance().state.chart !== null, "should render coverage");
        result
          .find(CoverageChart)
          .find("div.scrollable-list")
          .first()
          .find("a")
          .last()
          .simulate("click", { shiftKey: true });
        result.update();
        result
          .find(CoverageChart)
          .find("div.scrollable-list")
          .first()
          .find("a")
          .first()
          .simulate("click", { shiftKey: true });
        result.update();
        result
          .find(CoverageChart)
          .find("button")
          .simulate("click");
        setTimeout(() => {
          result.update();
          t.ok(
            result.find(CoverageChart).instance().state.url,
            "/dtale/coverage?group=%5B%7B%22name%22%3A%22col1%22%7D%5D&col=col3&query=",
            "should update chart URL"
          );
          result
            .find(CoverageChart)
            .instance()
            .viewTimeDetails({});
          result.update();
          t.deepEqual(
            result.find(CoverageChartBody).instance().state.chart.options.scales.xAxes[0],
            { ticks: { min: "2018-12-03", max: "2018-12-17" } },
            "should limit x-axis"
          );
          result
            .find(CoverageChart)
            .instance()
            .resetZoom();
          result.update();
          t.notOk(
            result.find(CoverageChartBody).instance().state.chart.options.scales.xAxes[0].length == 0,
            "should clear limited x-axis"
          );
          done();
        }, 400);
      }, 400);
    }, 600);
  });
});
