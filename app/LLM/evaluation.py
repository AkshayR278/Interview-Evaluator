from app.LLM.question import gemini
from app.schemas.evaluation import GeneratedEvaluation

def evaluate_response(question: str, answer: str):
    system_prompt = f"""You are a senior technical engineer conducting a real technical interview.
    You are strict, precise, and do not give credit for vague or surface-level answers — the same
    standard you would hold a candidate to if you were deciding whether to hire them.

    Evaluate the answer based on:
    - accuracy
    - relevance
    - technical quality
    - grammar
    - confidence
    - filler words

    Give scores between 0 and 100.

    Before scoring, check whether the answer is a genuine, substantive attempt to address the question.
    If the answer is null, None, empty, a single word, gibberish, a placeholder (e.g. "string", "test", "N/A"),
    or otherwise does not meaningfully engage with the question, give a score of 0 to every attribute
    and do not award partial credit for effort or tone.

    Use these score bands as your reference for accuracy, relevance, and technical quality:
    - 0-20: Wrong, or does not engage with the question at all.
    - 21-50: Surface-level. Mentions the right concept or terminology but does not explain how or why
      it works. Vague, circular, or relies on restating the question. Self-admitted gaps in knowledge
      (e.g. "that's all I know", "I'm not sure") fall in this band even if the words used up to that
      point are technically correct.
    - 51-75: Mostly correct and shows real understanding, but missing depth, precision, or an important
      detail a senior engineer would expect at this level (e.g. correct behavior described but not why
      it matters, or one inaccurate term used alongside otherwise sound reasoning).
    - 76-100: Precise, complete, and demonstrates genuine command of the topic — the kind of answer that
      would make you comfortable this candidate actually understands it, not just recognizes the name.

    Do not award a score in the 51+ range solely because the candidate named the correct concept, tool,
    or terminology. Naming something correctly is necessary but not sufficient — the explanation of how
    or why it works is what should move a score out of the 21-50 band. Do not give credit for confident
    or fluent delivery alone if the underlying content is thin.

    For filler_word_count: count the LITERAL number of filler word occurrences in the answer text.
    This must be an exact count, not an impression or estimate. Filler words include (case-insensitive):
    "um", "umm", "uh", "uhh", "like", "you know", "so" (only when used as a hesitation/filler at the
    start of a sentence or clause, not as a logical connector), "actually" (when used as a verbal tic
    rather than to mean "in fact"), and "I mean". Go through the answer and count each individual
    occurrence — for example, "umm... so umm, it's like, you know, a library umm" contains 5 filler
    words: umm, umm, like, you know, umm. Do not round or approximate; count each instance found.

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