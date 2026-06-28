namespace TaskBoard.Application.Common.Exceptions;

public class NotFoundException(string name, object key)
    : Exception($"'{name}' con id '{key}' no fue encontrado.");
