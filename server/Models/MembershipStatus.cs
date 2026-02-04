namespace CdpApi.Models;

public enum MembershipStatus
{
    Pending = 0,    // Registered but hasn't paid first quota
    Active = 1,     // Has paid at least one quota
    Inactive = 2    // Membership lapsed (not paid)
}
