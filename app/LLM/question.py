import os
from dotenv import load_dotenv
from openai import OpenAI
from app.schemas.question import GeneratedQuestions

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
gemini = OpenAI(base_url=GEMINI_BASE_URL, api_key=API_KEY)

def generate_questions(role, company, count=5):
    system_prompt = f"""You are a senior {role} engineer at {company}. Your company is hiring for {role} freshers i.e., 
    Give me exactly {count} technical questions you would ask the candidate"""

    user_prompt_prefix = "Good morning sir."

    messages = [{"role":"system", "content":system_prompt}, {"role":"user", "content":user_prompt_prefix}]
    response = gemini.chat.completions.parse(model="gemini-3.1-flash-lite", messages=messages, response_format=GeneratedQuestions)
    raw_generated_questions = response.choices[0].message.parsed.questions

    if len(raw_generated_questions) != count:
        raise ValueError(f"LLM did not generate exactly {count} questions")
    else:
        questions = [question.question for question in raw_generated_questions]
        return questions