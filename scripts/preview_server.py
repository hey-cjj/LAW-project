#!/usr/bin/env python3
"""Serve the buildless site locally, including HTTP byte ranges for video."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import os
import re

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__qa/mobile':
            content = b'<!doctype html><html><head><title>LAW mobile layout check</title></head><body style="margin:0;background:#ddd;padding:18px;display:flex;justify-content:center"><iframe title="390px LAW mobile preview" src="/" style="border:0;width:390px;height:844px;background:#f8f7f3"></iframe></body></html>'
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        super().do_GET()

    def send_head(self):
        self.byte_range = None
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            file = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None
        size = os.fstat(file.fileno()).st_size
        header = self.headers.get('Range')
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', header or '')
        if match:
            start, end = match.groups()
            if start:
                start = int(start)
                end = min(int(end) if end else size - 1, size - 1)
            else:
                start, end = max(0, size - int(end or 0)), size - 1
            if start >= size or start > end:
                file.close()
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
            self.byte_range = (start, end)
            self.send_response(206)
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Content-Length', str(end - start + 1))
            file.seek(start)
        else:
            self.send_response(200)
            self.send_header('Content-Length', str(size))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        return file

    def copyfile(self, source, outputfile):
        if not self.byte_range:
            return super().copyfile(source, outputfile)
        remaining = self.byte_range[1] - self.byte_range[0] + 1
        while remaining:
            block = source.read(min(65536, remaining))
            if not block:
                break
            outputfile.write(block)
            remaining -= len(block)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    os.chdir(Path(__file__).resolve().parents[1] / 'dist')
    print(f'LAW preview: http://localhost:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
