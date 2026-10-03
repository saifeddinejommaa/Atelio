namespace Atelio.Domain;

/// <summary>Règle métier non respectée : renvoyée au client en 400 avec ce message.</summary>
public class BusinessException : Exception
{
    public BusinessException(string message)
        : base(message) { }
}

/// <summary>Ressource introuvable : renvoyée au client en 404.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message)
        : base(message) { }
}
