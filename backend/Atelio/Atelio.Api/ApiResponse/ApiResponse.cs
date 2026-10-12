namespace Atelio.Api.ApiResponse;

public class ApiResponse<T>
{
    public int Code { get; set; }

    public T? Response { get; set; }

    public string? ResponseMessage { get; set; }

    public ApiResponse() { }

    public ApiResponse(int code, T? response, string message)
    {
        Code = code;
        Response = response;
        ResponseMessage = message;
    }
}
