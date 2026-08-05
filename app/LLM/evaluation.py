from app.LLM.question import gemini
from app.schemas.evaluation import GeneratedEvaluation

def evaluate_response(question: str, answer: str):
    system_prompt = f"""You are a senior technical engineer evaluating a candidate's answer.
    Evaluate the answer based on:
    - accuracy
    - relevance
    - technical quality
    - grammar
    - confidence
    - filler words

    Give scores between 0 and 100.

    QUESTION:
        {question}
    """

    user_prompt = answer
    message = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = gemini.chat.completions.parse(
        model="gemini-3.1-flash-lite",
        messages=message,
        response_format=GeneratedEvaluation
    )

    return response.choices[0].message.parsed
