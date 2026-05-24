export const subscribeUser = async () => {
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "BOQ2BUqoBNSChvM8rYesm002ZeJDHTMafgb_rNSyUl4t4wtzp5geIvbwT0AgGI7OWb7I0MRhX0Ifj_f8pI3CYYQ"
  })

  return subscription
}