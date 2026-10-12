# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own types/packages
- Internal collaborators
- Anything you control

A client interface you own that represents an external service is still a system boundary and can be mocked. The restrictions above concern internal application behavior, not ownership of the client interface.

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally. For services, inject clients through the constructor and store them on the service:

```go
type PaymentClient interface {
	Charge(ctx context.Context, total int64) error
}

type PaymentService struct {
	client PaymentClient
}

// Easy to mock: inject the external client through the constructor.
// Production passes a real client; tests pass a mock of PaymentClient.
func NewPaymentService(client PaymentClient) *PaymentService {
	return &PaymentService{client: client}
}

func (s *PaymentService) ProcessPayment(ctx context.Context, order Order) error {
	return s.client.Charge(ctx, order.Total)
}

// Hard to mock: the service creates its external client internally.
func NewPaymentService() *PaymentService {
	return &PaymentService{client: NewStripeClient(os.Getenv("STRIPE_KEY"))}
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```go
// GOOD: Each method is independently mockable
type APIClient interface {
	GetUser(ctx context.Context, id string) (User, error)
	GetOrders(ctx context.Context, userID string) ([]Order, error)
	CreateOrder(ctx context.Context, input OrderInput) (Order, error)
}

// BAD: Mocking requires conditional logic inside the mock
type APIClient interface {
	Fetch(ctx context.Context, endpoint string, options RequestOptions) ([]byte, error)
}
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint
