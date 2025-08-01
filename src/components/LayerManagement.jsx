import React, { useState } from "react"
import { Input } from "./ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar"
import { Button } from "./ui/button"
import { Label } from "@/components/ui/label"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AddLayer from "./AddLayer"
import EditLayer from "./EditLayer"

const data = [
  {
    id: "m5gr84i9",
    layer: "Layer 1",
    category: "Chiba University",
    layerDate: "07/08/2025",
    dateUpload: "23/07/2025",
    description: "Lorem ipsum dolor sit amet.",
    source: "Chiba University",
    visibility: "public",
  },
  {
    id: "3u1reuv4",
    layer: "Layer 2",
    category: "Chiba University",
    layerDate: "02/08/2025",
    dateUpload: "24/07/2025",
    description: "Lorem ipsum dolor sit amet.",
    source: "Chiba University",
    visibility: "public",
  },
  {
    id: "derv1ws0",
    layer: "Layer 3",
    category: "Chiba University",
    layerDate: "03/08/2025",
    dateUpload: "25/07/2025",
    description: "Lorem ipsum dolor sit amet.",
    source: "Chiba University",
    visibility: "private",
  },
  {
    id: "5kma53ae",
    layer: "Layer 4",
    category: "Chiba University",
    layerDate: "01/08/2025",
    dateUpload: "26/07/2025",
    description: "Lorem ipsum dolor sit amet.",
    source: "Chiba University",
    visibility: "public",
  },
  {
    id: "bhqecj4p",
    layer: "Layer 5",
    category: "Chiba University",
    layerDate: "04/08/2025",
    dateUpload: "27/07/2025",
    description: "Lorem ipsum dolor sit amet.",
    source: "Chiba University",
    visibility: "private",
  },
]

const sortByDate = (rowA, rowB, columnId) => {
  const parseDate = (str) => {
    const [day, month, year] = str.split("/")
    return new Date(`${year}-${month}-${day}`) // Format ISO
  }

  const dateA = parseDate(rowA.getValue(columnId))
  const dateB = parseDate(rowB.getValue(columnId))

  return dateA - dateB
}

export const columns = [
  {
    accessorKey: "layer",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Layer name</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => <div>{row.getValue("layer")}</div>,
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Category</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "layerDate",
    sortingFn: sortByDate,
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <div className="">Layer date</div>
        <Button
          variant="ghost"
          className="hover:bg-gray-200 !p-1 h-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("layerDate")}</div>
    },
  },
  {
    accessorKey: "dateUpload",
    sortingFn: sortByDate,
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <div className="">Date uploaded</div>
        <Button
          variant="ghost"
          className="hover:bg-gray-200 !p-1 h-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("dateUpload")}</div>
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <div className="">Source</div>
        <Button
          variant="ghost"
          className="hover:bg-gray-200 !p-1 h-fit"
          // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("source")}</div>
    ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("visibility")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="action flex gap-2">
          <EditLayer />
          <Dialog>
            <DialogTrigger>
              <Eye className="size-[1rem] cursor-pointer" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set visibility to private?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Yes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger>
              <Trash2
                className="size-[1rem] cursor-pointer"
                stroke="red"
              />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete layer</DialogTitle>
                <DialogDescription>
                  Are you sure to delete {row.original.layer}?{" "}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant={"destructive"}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )
    },
  },
]

function LayerManagement() {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="bg-gray-200 p-12">
      <div className="bg-gray-50 py-8 px-12 rounded-lg">
        <div className="heading flex items-center">
          <div className="title flex-1">
            <div className="text-xl font-semibold">Layer Management</div>
            <div className="text-gray-400">Manage Layer (TIFF and GeoJSON)</div>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <Input
              placeholder="Search layer..."
              value={table.getColumn("layer")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("layer")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Filter</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>View All</MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Layer</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Category</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Layer date</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Date uploaded</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Source</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Visibility</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            <AddLayer />
          </div>
        </div>
        <div className="table w-full">
          <div className="overflow-hidden rounded-md border mt-8">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center space-x-2 py-4">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerManagement
