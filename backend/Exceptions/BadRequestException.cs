namespace backend.Exceptions;

/// <summary>Thrown by services for invalid input. Mapped to HTTP 400 ProblemDetails.</summary>
public class BadRequestException(string message) : Exception(message);
