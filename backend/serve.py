from waitress import serve
from backend.wsgi import application

if __name__ == '__main__':
    print("Starting Waitress on http://127.0.0.1:8000")
    serve(
        application,
        host='127.0.0.1',
        port=8000,
        threads=4
    )