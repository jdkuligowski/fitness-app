import requests

def send_expo_push(token, title, body):
    url = "https://exp.host/--/api/v2/push/send"
    data = {
      "to": token,
      "title": title,
      "body": body,
    }
    resp = requests.post(url, json=data)
    print(resp.text)  # debug
    return resp.json()
