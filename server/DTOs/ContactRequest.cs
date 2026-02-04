using System.ComponentModel.DataAnnotations;

namespace server.DTOs
{
    public class ContactRequest
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email é obrigatório")]
        [EmailAddress(ErrorMessage = "Email inválido")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Assunto é obrigatório")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mensagem é obrigatória")]
        [MinLength(10, ErrorMessage = "Mensagem deve ter pelo menos 10 caracteres")]
        public string Message { get; set; } = string.Empty;
    }
}
