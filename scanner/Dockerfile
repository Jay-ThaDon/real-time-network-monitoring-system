FROM python:3.11-slim

WORKDIR /app

# Install standard ping utility binary required for OS execution inside containers
RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*

# Copy script and dependency specifications
COPY requirements.txt* ./
# Install dependencies if you have a requirements file, otherwise skip safely
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

COPY scanner.py .

# Run the python tracking loop script
CMD ["python", "scanner.py"]
