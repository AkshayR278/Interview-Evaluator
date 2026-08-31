def calculate_response_score(
    accuracy_score,
    relevance_score,
    technical_score,
    confidence_score,
    grammar_score
):
    response_score = (
        accuracy_score * 0.3
        + relevance_score * 0.3
        + technical_score * 0.2
        + confidence_score * 0.1
        + grammar_score * 0.1
    )

    return response_score

def calculate_interview_score(evaluations, total_questions):
    total_score = 0
    for evaluation in evaluations:
        total_score += calculate_response_score(
            accuracy_score=evaluation.accuracy_score,
            relevance_score=evaluation.relevance_score,
            technical_score=evaluation.technical_score,
            confidence_score=evaluation.confidence_score,
            grammar_score=evaluation.grammar_score)
    interview_score = round(total_score/total_questions)
    return interview_score