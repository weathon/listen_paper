from starlette.exceptions import HTTPException as StarletteHTTPException
from openai import OpenAI
from fastapi import Request
from fastapi.responses import HTMLResponse
import uvicorn
from fastapi.staticfiles import StaticFiles
import threading
import os
from fastapi.responses import FileResponse
import requests
import urllib.request
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
from fastapi import Header
from openai import OpenAI
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def tts(text, filepath, apikey):
    print("tts")
    client = OpenAI(api_key = apikey)

    speech_file_path = filepath
    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text
    )

    response.stream_to_file(speech_file_path)
    return speech_file_path
import os
    
@app.post("/api/arxiv")
def arxiv_url(url, Authorization: str = Header(None)):
    # if not url.startswith("https://arxiv.org/pdf/"):
    #     return {"error": "Invalid URL"}

    # download the pdf and then read the pdf into text
    response = requests.get(url)
    with open(f"{url.split('/')[-1]}.pdf", "wb") as f:
        f.write(response.content)

    # Open the downloaded PDF file 
    with open(f"{url.split('/')[-1]}.pdf", "rb") as f:
        # Create a PDF reader object
        pdf_reader = PyPDF2.PdfReader(f)

        # Initialize an empty string to store the extracted text
        extracted_text = ""

        # Iterate over each page in the PDF
        for page_num in range(len(pdf_reader.pages)):
            # Extract the text from the current page
            page = pdf_reader.pages[page_num]
            text = page.extract_text()

            # Append the extracted text to the overall text
            extracted_text += text

    # Process the extracted text using the api_key

    client = OpenAI(api_key = Authorization.split(" ")[-1])

    text = []
    for i, j in enumerate(extracted_text.split(". ")):
        text.append(j)
    title = extracted_text.split("\n")[0]
    new_text = []
    tmp = ""
    for i, j in enumerate(text):
        if len(tmp) + len(j) < 2000:
            tmp += j + ". "
        else:
            new_text.append({"title": "Section {:04d}".format(i+1), "content": tmp})
            tmp = j + ". "


    os.makedirs(f"arxiv/{url.split('/')[-1]}", exist_ok=True)
    threads = []
    for i in new_text:
        t = threading.Thread(target=tts, args=(i["content"], f"arxiv/{url.split('/')[-1]}/{i['title']}.mp3", Authorization.split(" ")[-1]))
        t.start()
        threads.append(t)
    for t in threads:
        t.join()
    with open(f"arxiv/{url.split('/')[-1]}/metadata.json", "w") as f:
        json.dump([title,new_text], f)
    return 


@app.get("/api/list_articles")
def list_articles():
    folders = os.listdir("arxiv")
    titles = []
    for folder in folders:
        with open(f"arxiv/{folder}/metadata.json", "r") as f:
            data = json.load(f)
            titles.append(data[0])
    return [{"id": i, "title": j} for i, j in zip(folders, titles)]

@app.get("/api/get_article/{article_id}")
def get_article(article_id):
    return os.listdir(f"arxiv/{article_id}")

@app.get("/api/get_audio/{article_id}/{audio_id}")
def get_audio(article_id, audio_id):
    # return as file
    return FileResponse(f"arxiv/{article_id}/{audio_id}")


# mount static files on dist to root
app.mount("/", StaticFiles(directory="dist"), name="static")
# setup if not found, return index.html in dist and let react handle it with code 200
@app.exception_handler(StarletteHTTPException)
async def not_found(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return FileResponse("dist/index.html", media_type="text/html")
    return exc