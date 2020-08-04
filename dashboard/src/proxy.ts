/*
    proxy.py
    ~~~~~~~~
    ⚡⚡⚡ Fast, Lightweight, Pluggable, TLS interception capable proxy server focused on
    Network monitoring, controls & Application development, testing, debugging.

    :copyright: (c) 2013-present by Abhinav Singh and contributors.
    :license: BSD, see LICENSE for more details.
*/
import { WebsocketApi } from './core/ws'
import { IDashboardPlugin, IPluginConstructor } from './core/plugin'

import { HomePlugin } from './core/plugins/home'
import { InspectTrafficPlugin } from './core/plugins/inspect_traffic'
import { SettingsPlugin } from './core/plugins/settings'

import { MockRestApiPlugin } from './plugins/mock_rest_api'
import { ShortlinkPlugin } from './plugins/shortlink'
import { TrafficControlPlugin } from './plugins/traffic_control'

export class ProxyDashboard {
  private static plugins: IPluginConstructor[] = [];
  private plugins: Map<string, IDashboardPlugin> = new Map();
  private readonly websocketApi: WebsocketApi
  private readonly route: string = '/dashboard/'

  constructor () {
    this.websocketApi = new WebsocketApi()

    for (const Plugin of ProxyDashboard.plugins) {
      const p = new Plugin(this.websocketApi)
      $('#proxyTopNav ul').append(
        $('<li/>')
          .addClass('nav-item')
          .append(p.initializeTab())
      )
      $('#proxyDashboard').append(
        $('<section></section>')
          .attr('id', p.name)
          .addClass('proxy-dashboard-plugin')
          .append(
            $('<div></div>')
              .addClass('app-header')
              .append(p.initializeHeader())
          )
          .append(
            $('<div></div>')
              .addClass('app-body')
              .append(p.initializeBody())
          )
      )
      this.plugins.set(p.name, p)
    }

    const that = this
    $('#proxyTopNav>ul>li>a').on('click', function () {
      that.switchTab(this)
    })
    window.onhashchange = function () {
      that.onHashChange()
    }
    if (window.location.hash === '#' || window.location.hash === '') {
      window.location.hash = '#home'
    } else {
      // This can cause race condition where plugin is activated and
      // it tries to use WebsocketAPI before it has successfully connected to the server.
      // A solution is to have buffer management within WebsocketAPI or raise an exception
      // to try again.
      $('#' + this.plugins.get(window.location.hash.substring(1)).tabId()).click()
    }
  }

  public static addPlugin (Plugin: IPluginConstructor) {
    ProxyDashboard.plugins.push(Plugin)
  }

  private onHashChange () {
    const activeLi = $('#proxyTopNav>ul>li.active')
    const activeTabPluginName = activeLi.children('a').attr('plugin_name')
    const activeTabHash = activeLi.children('a').attr('href')
    if (window.location.hash !== activeTabHash) {
      this.navigate(activeTabPluginName, window.location.hash.substring(1))
    }
  }

  private switchTab (element: HTMLElement) {
    const activeTabPluginName = $('#proxyTopNav>ul>li.active').children('a').attr('plugin_name')
    const clickedTabPluginName = $(element).attr('plugin_name')
    if (clickedTabPluginName === activeTabPluginName) {
      return
    }

    this.navigate(activeTabPluginName, clickedTabPluginName)
    window.history.pushState(null, null, this.route + '#' + clickedTabPluginName)
  }

  private navigate (activeTabPluginName: string, clickedTabPluginName: string) {
    console.log('Navigating from', activeTabPluginName, 'to', clickedTabPluginName)
    if (activeTabPluginName !== undefined) {
      $('#' + this.plugins.get(activeTabPluginName).tabId())
        .parent('li')
        .removeClass('active')
    }
    $('#' + this.plugins.get(clickedTabPluginName).tabId())
      .parent('li')
      .addClass('active')

    $('#proxyDashboard>.proxy-dashboard-plugin').hide()
    $('#' + clickedTabPluginName).show()

    if (activeTabPluginName !== undefined) {
      this.plugins.get(activeTabPluginName).deactivated()
    }
    this.plugins.get(clickedTabPluginName).activated()
  }
}

// TODO: Decouple plugin scripts from proxy.ts
// Plugin scripts must load independently
ProxyDashboard.addPlugin(HomePlugin)
ProxyDashboard.addPlugin(MockRestApiPlugin)
ProxyDashboard.addPlugin(InspectTrafficPlugin)
ProxyDashboard.addPlugin(ShortlinkPlugin)
ProxyDashboard.addPlugin(TrafficControlPlugin)
ProxyDashboard.addPlugin(SettingsPlugin)

const dashboard = new ProxyDashboard()
console.log(dashboard)
