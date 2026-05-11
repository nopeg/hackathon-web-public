FROM python:3.12
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app
COPY . .
RUN mkdir -p /app/static/uploads

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]