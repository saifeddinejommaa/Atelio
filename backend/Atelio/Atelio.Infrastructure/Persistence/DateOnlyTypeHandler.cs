using Dapper;
using System.Data;

namespace Atelio.Infrastructure.Persistence;

/// <summary>Dapper ne gère pas DateOnly : paramètre envoyé en date PostgreSQL, colonne date lue en DateOnly.</summary>
public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value;
    }

    public override DateOnly Parse(object value) => value switch
    {
        DateOnly date => date,
        DateTime dateTime => DateOnly.FromDateTime(dateTime),
        _ => DateOnly.Parse(value.ToString()!),
    };
}
