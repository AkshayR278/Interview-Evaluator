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
    
    Before scoring, check whether the answer is a genuine, substantive attempt to address the question.
    If the answer is null, empty, a single word, gibberish, a placeholder (e.g. "string", "test", "N/A"),
    or otherwise does not meaningfully engage with the question, give a score of 0 to every attribute
    and do not award partial credit for effort or tone.

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
