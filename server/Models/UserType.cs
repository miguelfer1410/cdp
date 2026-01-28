namespace CdpApi.Models;

public enum UserType
{
    Socio = 1,      // Member (can self-register)
    Atleta = 2,     // Athlete
    Treinador = 3,  // Coach/Trainer
    Admin = 4       // Administrator
}
