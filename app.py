from flask import Flask, render_template, request, jsonify
import os
import requests
from dotenv import load_dotenv

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "openrouter/free"
)


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# CHAT API
# ============================================================

@app.route("/chat", methods=["POST"])
def chat():

    try:

        # ----------------------------------------------------
        # CHECK API KEY
        # ----------------------------------------------------

        if not OPENROUTER_API_KEY:

            return jsonify({
                "error": "OpenRouter API key is not configured."
            }), 500


        # ----------------------------------------------------
        # GET USER MESSAGE
        # ----------------------------------------------------

        data = request.get_json()

        if not data:

            return jsonify({
                "error": "Invalid request."
            }), 400


        message = data.get("message", "").strip()


        if not message:

            return jsonify({
                "error": "Message is required."
            }), 400


        # ----------------------------------------------------
        # SPORTIQ SYSTEM PROMPT
        # ----------------------------------------------------

        system_prompt = """
You are SportIQ, an AI sports assistant.

Your responses must be concise, systematic and easy to read.

RESPONSE RULES:

- Normally keep responses between 50 and 120 words.
- Simple questions should be answered in 2–5 sentences.
- Give the direct answer first.
- Use short headings when useful.
- Use bullet points for lists.
- Use numbered steps for instructions.
- Keep paragraphs short.
- Avoid repetition.
- Do not provide unnecessary background information.
- Answer only what the user asks.
- For comparisons, use a simple table or bullet points.
- For definitions, give the definition first followed by key points.
- Provide more detail only when the question genuinely requires it.
- Do not produce long essays.
- Do not repeat the same information in different words.
- Keep the answer professional and easy to scan.

You can answer questions about:

- Cricket
- Football
- Basketball
- Tennis
- Formula 1
- Boxing
- Athletics
- Baseball
- Volleyball
- Badminton
- Wrestling
- Other sports

If you are uncertain about information, clearly say so.

Do not invent statistics, records, scores or player information.
"""


        # ----------------------------------------------------
        # OPENROUTER REQUEST
        # ----------------------------------------------------

        response = requests.post(

            "https://openrouter.ai/api/v1/chat/completions",

            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENROUTER_API_KEY}"
            },

            json={

                "model": OPENROUTER_MODEL,

                "messages": [

                    {
                        "role": "system",
                        "content": system_prompt
                    },

                    {
                        "role": "user",
                        "content": message
                    }

                ],

                # Helps keep answers short
                "temperature": 0.5,

                "max_tokens": 300

            },

            timeout=60
        )


        # ----------------------------------------------------
        # OPENROUTER RESPONSE
        # ----------------------------------------------------

        result = response.json()


        # ----------------------------------------------------
        # HANDLE OPENROUTER ERROR
        # ----------------------------------------------------

        if response.status_code != 200:

            print("OpenRouter Error:")
            print(result)

            error_message = (
                result.get("error", {}).get("message")
                if isinstance(result.get("error"), dict)
                else None
            )

            return jsonify({

                "error":
                    error_message
                    or "OpenRouter request failed."

            }), response.status_code


        # ----------------------------------------------------
        # GET AI RESPONSE
        # ----------------------------------------------------

        reply = (
            result
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )


        if not reply:

            reply = "Sorry, I couldn't generate a response."


        # ----------------------------------------------------
        # SEND RESPONSE TO FRONTEND
        # ----------------------------------------------------

        return jsonify({

            "response": reply

        })


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except requests.exceptions.Timeout:

        return jsonify({

            "error":
                "The AI service took too long to respond. Please try again."

        }), 504


    except requests.exceptions.RequestException as error:

        print("Request error:", error)

        return jsonify({

            "error":
                "Could not connect to the AI service."

        }), 500


    except Exception as error:

        print("Server error:", error)

        return jsonify({

            "error":
                "Something went wrong while processing your request."

        }), 500


# ============================================================
# RUN FLASK SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )