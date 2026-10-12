# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```go
// GOOD: Each test case owns its setup and checks
func TestCheckout(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		setup func() *Cart
		check func(t *testing.T, got CheckoutResult, err error)
	}{
		{
			name: "checkout with one item",
			setup: func() *Cart {
				cart := NewCart()
				cart.Add(product)
				return cart
			},
			check: func(t *testing.T, got CheckoutResult, err error) {
				t.Helper()

				require.NoError(t, err)
				assert.Equal(t, "confirmed", got.Status)
			},
		},
		{
			name: "checkout with multiple items",
			setup: func() *Cart {
				cart := NewCart()
				cart.Add(product)
				cart.Add(product)
				return cart
			},
			check: func(t *testing.T, got CheckoutResult, err error) {
				t.Helper()

				require.NoError(t, err)
				assert.Equal(t, "confirmed", got.Status)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			cart := tt.setup()
			got, err := Checkout(t.Context(), cart, paymentMethod)
			tt.check(t, got, err)
		})
	}
}
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```go
// BAD: Tests implementation details of an internal collaborator
func TestCheckoutCallsPaymentServiceProcess(t *testing.T) {
	payment := NewMockPaymentService(t)
	payment.EXPECT().Process(t.Context(), cart.Total()).Return(nil)
	if _, err := Checkout(t.Context(), cart, payment); err != nil {
		t.Fatal(err)
	}
}
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```go
// BAD: Bypasses interface to verify
func TestCreateUserSavesToDatabase(t *testing.T) {
	if _, err := CreateUser(t.Context(), UserInput{Name: "Alice"}); err != nil {
		t.Fatal(err)
	}
	var id string
	err := db.QueryRowContext(t.Context(),
		"SELECT id FROM users WHERE name = ?", "Alice").Scan(&id)
	if err != nil {
		t.Fatal(err)
	}
}

// GOOD: Verifies through interface
func TestCreateUserMakesUserRetrievable(t *testing.T) {
	user, err := CreateUser(t.Context(), UserInput{Name: "Alice"})
	if err != nil {
		t.Fatal(err)
	}
	retrieved, err := GetUser(t.Context(), user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if retrieved.Name != "Alice" {
		t.Fatalf("name = %q, want Alice", retrieved.Name)
	}
}
```

**Tautological tests**: Expected value restates the implementation, so the test passes by construction.

```go
// BAD: Expected value is recomputed the way the code computes it
func TestCalculateTotalSumsLineItems(t *testing.T) {
	items := []Item{{Price: 10}, {Price: 5}}
	expected := 0
	for _, item := range items {
		expected += item.Price
	}
	if got := CalculateTotal(items); got != expected {
		t.Fatalf("total = %d, want %d", got, expected)
	}
}

// GOOD: Expected value is an independent, known literal
func TestCalculateTotalSumsLineItems(t *testing.T) {
	if got := CalculateTotal([]Item{{Price: 10}, {Price: 5}}); got != 15 {
		t.Fatalf("total = %d, want 15", got)
	}
}
```
