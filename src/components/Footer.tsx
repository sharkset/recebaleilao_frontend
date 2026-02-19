export default function Footer() {
    return (
        <footer className="border-t border-gray-100 bg-white py-12">
            <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} RecebaLeilão. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}
