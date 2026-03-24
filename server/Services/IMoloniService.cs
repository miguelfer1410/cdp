using System.Threading.Tasks;
using CdpApi.Models;

namespace CdpApi.Services
{
    public interface IMoloniService
    {
        Task CreateInvoiceReceiptAsync(Payment payment, User user);
    }
}
