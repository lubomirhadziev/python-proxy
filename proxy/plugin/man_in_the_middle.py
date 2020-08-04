# -*- coding: utf-8 -*-
"""
    proxy.py
    ~~~~~~~~
    ⚡⚡⚡ Fast, Lightweight, Pluggable, TLS interception capable proxy server focused on
    Network monitoring, controls & Application development, testing, debugging.

    :copyright: (c) 2013-present by Abhinav Singh and contributors.
    :license: BSD, see LICENSE for more details.
"""
import logging
import socket
from typing import Optional

from ..common.utils import build_http_response
from ..http.parser import HttpParser
from ..http.codes import httpStatusCodes
from ..http.proxy import HttpProxyBasePlugin

logger = logging.getLogger(__name__)


class ManInTheMiddlePlugin(HttpProxyBasePlugin):
    """Modifies upstream server responses."""

    def before_upstream_connection(
        self, request: HttpParser) -> Optional[HttpParser]:
        address = '94.155.136.17'
        request.add_header(b'X-Forwarded-For', bytes('%s' % address, encoding='UTF-8'))


        return request

    def handle_client_request(
        self, request: HttpParser) -> Optional[HttpParser]:
        address = '94.155.136.17'
        # address = socket.gethostbyname(socket.gethostname())
        request.add_header(b'X-Forwarded-For', bytes('%s' % address, encoding='UTF-8'))

        return request

    def handle_upstream_chunk(self, chunk: memoryview) -> memoryview:
        address = socket.gethostbyname(socket.gethostname())

        logger.error('Access from IP %s' % address)

        return chunk

        # return memoryview(build_http_response(
        #     httpStatusCodes.OK,
        #     reason=b'OK', body=bytes('%s' % address, encoding='UTF-8')))

        return memoryview(build_http_response(
            httpStatusCodes.OK,
            reason=b'OK', body=b'Hello from man in the middle'))

    def on_upstream_connection_close(self) -> None:
        pass
